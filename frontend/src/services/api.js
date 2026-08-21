const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (typeof window !== "undefined" && (window.location.port === "5173" || window.location.host.includes("5173")) ? "" : "http://127.0.0.1:8000");

const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("fakesense_token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("fakesense_token");
      localStorage.removeItem("fakesense_user");
      window.dispatchEvent(new Event("auth_unauthorized"));
    }
    let errorDetail = "An unexpected error occurred.";
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errData.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return response.json();
};

export const api = {
  // Base URL
  baseUrl: API_BASE_URL,

  // Auth Endpoints
  auth: {
    register: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    forgotPassword: async (email) => {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return handleResponse(res);
    },
    verifyOtp: async (email, otpCode) => {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode }),
      });
      return handleResponse(res);
    },
    resetPassword: async (paramsOrEmail, otpCode, newPassword, confirmPassword) => {
      let body;
      if (typeof paramsOrEmail === "object" && paramsOrEmail !== null) {
        body = paramsOrEmail;
      } else {
        body = {
          email: paramsOrEmail,
          otp_code: otpCode,
          new_password: newPassword,
          confirm_password: confirmPassword || newPassword,
        };
      }
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
  },

  // Verification Endpoints
  verify: {
    uploadAndVerify: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/verify`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },
    getById: async (id) => {
      const res = await fetch(`${API_BASE_URL}/verify/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE_URL}/verify/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    whatIf: async (verificationId, excludedSignals) => {
      const res = await fetch(`${API_BASE_URL}/verify/what-if`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          verification_id: verificationId,
          excluded_signals: excludedSignals,
        }),
      });
      return handleResponse(res);
    },
  },

  // Media Serving Helpers
  media: {
    getMediaUrl: (verificationId) => {
      const token = localStorage.getItem("fakesense_token");
      return `${API_BASE_URL}/media/${verificationId}?token=${encodeURIComponent(token || "")}`;
    },
    getThumbnailUrl: (verificationId) => {
      const token = localStorage.getItem("fakesense_token");
      return `${API_BASE_URL}/media/${verificationId}/thumbnail?token=${encodeURIComponent(token || "")}`;
    }
  },

  // Compare Mode Endpoints
  compare: {
    upload: async (fileA, fileB) => {
      const formData = new FormData();
      formData.append("file_a", fileA);
      formData.append("file_b", fileB);

      const res = await fetch(`${API_BASE_URL}/compare/upload`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },
    byIds: async (idA, idB) => {
      const res = await fetch(`${API_BASE_URL}/compare/by-ids`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id_a: idA, id_b: idB }),
      });
      return handleResponse(res);
    },
    explain: async (idA, idB, question = null) => {
      const res = await fetch(`${API_BASE_URL}/compare/explain`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id_a: idA, id_b: idB, question }),
      });
      return handleResponse(res);
    },
  },

  // History Endpoints
  history: {
    getHistory: async ({
      page = 1,
      pageSize = 12,
      search = "",
      verdict = "",
      mediaType = "",
      dateRange = "",
      authenticityTier = "",
      sort = "newest"
    } = {}) => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append("search", search);
      if (verdict && verdict !== "all") params.append("verdict", verdict);
      if (mediaType && mediaType !== "all") params.append("media_type", mediaType);
      if (dateRange && dateRange !== "all") params.append("date_range", dateRange);
      if (authenticityTier && authenticityTier !== "all") params.append("authenticity_tier", authenticityTier);
      if (sort) params.append("sort", sort);

      const res = await fetch(`${API_BASE_URL}/history?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Dashboard Endpoints
  dashboard: {
    getSummary: async () => {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  // PDF Report Download
  report: {
    downloadReport: async (id) => {
      const token = localStorage.getItem("fakesense_token");
      const res = await fetch(`${API_BASE_URL}/verify/${id}/report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to generate PDF report");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FakeSense_Report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  },

  // AI Verification Agent Endpoints
  agent: {
    chat: async ({ verification_id, question, conversation_history = [], session_id = null }) => {
      const res = await fetch(`${API_BASE_URL}/api/agent/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          verification_id,
          question,
          conversation_history,
          session_id,
        }),
      });
      return handleResponse(res);
    },
    explainEvidence: async ({ verification_id, evidence_id, evidence_data = null }) => {
      const res = await fetch(`${API_BASE_URL}/api/agent/explain-evidence`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          verification_id,
          evidence_id,
          evidence_data,
        }),
      });
      return handleResponse(res);
    },
  },

  // Demo Samples
  samples: {
    getList: async () => {
      const res = await fetch(`${API_BASE_URL}/samples/list`);
      return handleResponse(res);
    },
    getSampleBlob: async (relativeUrl) => {
      const res = await fetch(`${API_BASE_URL}${relativeUrl}`);
      return res.blob();
    },
  },
};
