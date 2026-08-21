import React, { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import {
  Bot,
  User,
  Send,
  Sparkles,
  RotateCcw,
  AlertCircle
} from "lucide-react";

export const AgentChat = ({ verificationResult, externalPrompt }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const verificationId = verificationResult?.verification_id;
  const verdict = verificationResult?.verdict || "Inconclusive";
  const isManipulated = verdict === "Likely Manipulated";

  // Handle external prompt trigger
  useEffect(() => {
    if (externalPrompt && externalPrompt.trim()) {
      chatContainerRef.current?.scrollIntoView({ behavior: "smooth" });
      handleSendMessage(externalPrompt);
    }
  }, [externalPrompt]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Initial welcome message from the Agent
  useEffect(() => {
    if (verificationResult) {
      setMessages([
        {
          role: "assistant",
          content: `Hello! I am your **FakeSense AI Assistant**. I have analyzed the evidence for \`${verificationResult.file_name}\` (Verdict: **${verdict}**, Authenticity: **${verificationResult.authenticity_score}%**, Confidence: **${Math.round(verificationResult.confidence * 100)}%**).\n\nYou can ask questions about why this result was reached, inquire about specific forensic modules, or click any of the quick prompts below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [verificationId]);

  const handleSendMessage = async (textToSend) => {
    const question = (textToSend || input).trim();
    if (!question || loading || !verificationId) return;

    setError(null);
    setInput("");

    const userMessage = {
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const historyPayload = updatedHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await api.agent.chat({
        verification_id: verificationId,
        question: question,
        conversation_history: historyPayload,
      });

      const agentMessage = {
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      setError(err.message || "Failed to get response from AI Verification Agent.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `Conversation reset. Ask me anything about the **${verdict}** verification result for \`${verificationResult.file_name}\`.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setError(null);
  };

  const quickQuestions = isManipulated
    ? [
        "Why was this classified as manipulated?",
        "What evidence was found?",
        "Which analysis detected the strongest problem?",
        "Explain the CNN result",
        "Explain the face analysis",
        "What does the authenticity score mean?",
        "Are you completely sure?",
        "What would change the verdict?",
      ]
    : [
        "Why was this classified as real?",
        "What evidence was found?",
        "Explain the CNN result",
        "Explain the face analysis",
        "What does the authenticity score mean?",
        "Are you completely sure?",
        "What would change the verdict?",
      ];

  const renderMessageContent = (content) => {
    return content.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} style={{ fontSize: "0.95rem", fontWeight: 700, margin: "8px 0 4px 0", color: "var(--text-main)" }}>{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} style={{ fontSize: "1.05rem", fontWeight: 800, margin: "10px 0 4px 0", color: "var(--text-main)" }}>{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} style={{ marginLeft: "18px", marginBottom: "3px" }}>
            {formatInlineMarkdown(line.substring(2))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: "6px" }} />;
      }
      return <p key={idx} style={{ margin: "0 0 5px 0", lineHeight: "1.55" }}>{formatInlineMarkdown(line)}</p>;
    });
  };

  const formatInlineMarkdown = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: "var(--text-main)" }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="mono-text" style={{
            background: "var(--bg-surface-tertiary)",
            padding: "1px 5px",
            borderRadius: "4px",
            fontSize: "0.82em",
            color: "var(--color-primary)"
          }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div
      ref={chatContainerRef}
      className="saas-card animate-fade-in"
      style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}
    >
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #2563eb, #0284c7)",
            color: "#ffffff",
            display: "flex",
            boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)"
          }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                Ask FakeSense AI
              </h3>
              <span className="badge badge-blue" style={{ fontSize: "0.68rem" }}>AGENT</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Ask questions about this verification result.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="btn-secondary"
          style={{ padding: "5px 10px", fontSize: "0.76rem" }}
          title="Reset conversation"
        >
          <RotateCcw size={13} /> Reset Chat
        </button>
      </div>

      {/* Messages Thread Container */}
      <div style={{
        minHeight: "220px",
        maxHeight: "380px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        paddingRight: "6px"
      }}>
        {messages.map((msg, index) => {
          const isAssistant = msg.role === "assistant";
          return (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                justifyContent: isAssistant ? "flex-start" : "flex-end"
              }}
            >
              {isAssistant && (
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid var(--color-primary-border)"
                }}>
                  <Bot size={16} />
                </div>
              )}

              <div style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "10px",
                background: isAssistant ? "var(--bg-surface-secondary)" : "var(--color-primary)",
                color: isAssistant ? "var(--text-secondary)" : "#ffffff",
                border: isAssistant ? "1px solid var(--border-subtle)" : "none",
                fontSize: "0.86rem",
                boxShadow: "var(--shadow-xs)"
              }}>
                <div>{isAssistant ? renderMessageContent(msg.content) : msg.content}</div>
                <div style={{
                  fontSize: "0.68rem",
                  color: isAssistant ? "var(--text-faint)" : "rgba(255, 255, 255, 0.75)",
                  textAlign: "right",
                  marginTop: "4px"
                }}>
                  {msg.timestamp}
                </div>
              </div>

              {!isAssistant && (
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--bg-surface-tertiary)",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid var(--border-subtle)"
                }}>
                  <User size={15} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--color-primary-light)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Bot size={16} />
            </div>
            <div style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "var(--bg-surface-secondary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.84rem",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <Sparkles size={14} className="animate-spin" />
              <span>Analyzing forensic context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Suggested Inquiries:
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              style={{
                background: "var(--bg-surface-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                padding: "4px 10px",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary-border)";
                e.currentTarget.style.color = "var(--color-primary)";
                e.currentTarget.style.background = "var(--color-primary-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "var(--bg-surface-secondary)";
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: "8px 12px", background: "var(--color-fake-bg)", border: "1px solid var(--color-fake-border)", borderRadius: "6px", color: "var(--color-fake)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask a question about this verification result..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="input-field"
          style={{ padding: "10px 14px", fontSize: "0.88rem" }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{ padding: "10px 18px" }}
        >
          <Send size={15} />
          <span>Send</span>
        </button>
      </div>

    </div>
  );
};
