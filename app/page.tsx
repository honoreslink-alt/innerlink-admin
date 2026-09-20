"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ TIGER: PEGA AQUÍ EL LINK DE YOUTUBE DEL VIDEO DE PRESENTACIÓN      ║
// ║ Ejemplo: "https://www.youtube.com/watch?v=XXXXXXXXXXX"             ║
// ╚══════════════════════════════════════════════════════════════════════╝
const ADMIN_PRESENTATION_YOUTUBE_URL = "https://www.youtube.com/watch?v=yTFnPjrWAvM&list=RDyTFnPjrWAvM&start_radio=1";

const menuItems = [
  "Resumen",
  "Usuarios",
  "Anclajes",
  "Legados",
  "Premium",
  "Niveles",
  "Rankings",
  "Preguntas Personalizadas",
  "Actividad",
  "Pagos",
  "Logs & Seguridad",
  "Configuración",
];

type AdminActivityStatsRow = {
  total_responses: number | null;
  active_responses: number | null;
  users_with_responses: number | null;
  responses_today: number | null;
  responses_last_7_days: number | null;
  responses_last_30_days: number | null;
  active_users_last_7_days: number | null;
  active_users_last_30_days: number | null;
};

type AdminLevelsRankingsRow = {
  active_base_questions: number | null;
  users_level_0: number | null;
  users_level_1_plus: number | null;
  users_level_5_plus: number | null;
  users_level_10_plus: number | null;
  users_level_20_plus: number | null;
  users_level_30_plus: number | null;
  users_level_50_plus: number | null;
  users_level_70_plus: number | null;
  average_level: number | null;
  most_common_level: number | null;
  max_level_reached: number | null;
};

type AdminPremiumUserRow = {
  id: string;
  display_name: string | null;
  interlink_number: number;
  premium_status: string | null;
  premium_started_at: string | null;
  premium_expires_at: string | null;
  premium_source: string | null;
  premium_granted_by: string | null;
  level: number | null;
  created_at: string | null;
};

type AdminBaseQuestionRow = {
  id: string;
  question_key: string | null;
  title: string | null;
  category: string | null;
  stage: number | null;
  access_level: string | null;
  is_active: boolean | null;
  created_at: string | null;
  subquestions_count: number | null;
  responses_count: number | null;
};

type AdminAnchorOverviewRow = {
  active_anchors: number | null;
  historical_anchors: number | null;
  removed_anchors: number | null;
  linked_users: number | null;
  average_anchors_per_active_user: number | null;
};

type AdminAnchorListRow = {
  anchor_id: string;
  requester_id: string;
  requester_name: string | null;
  requester_interlink_number: number | null;
  receiver_id: string;
  receiver_name: string | null;
  receiver_interlink_number: number | null;
  anchor_status: string | null;
  created_at: string | null;
  responded_at: string | null;
  removed_at: string | null;
};

type AdminAnchorStatsRow = {
  anchors_0: number | null;
  anchors_1: number | null;
  anchors_2: number | null;
  anchors_3: number | null;
  anchors_4: number | null;
  anchors_5: number | null;
  total_active_anchors: number | null;
  free_active_anchors: number | null;
  premium_active_anchors: number | null;
};

type AdminLevelStatsRow = {
  level_1: number | null;
  level_5: number | null;
  level_10: number | null;
  level_15: number | null;
  level_20: number | null;
  level_25: number | null;
  level_31: number | null;
  most_common_level: number | null;
  average_level: number | null;
  users_at_level_31: number | null;
};

type AdminUserRow = {
  id: string;
  display_name: string | null;
  interlink_number: number;
  plan: string | null;
  premium_status: string | null;
  premium_expires_at: string | null;
  level: number | null;
  account_status: string | null;
  created_at: string | null;
  premium_source: string | null;
  answers_count: number | null;
  videos_count: number | null;
};

type User = {
  id: string;
  name: string;
  code: string;
  plan: "Premium" | "Free";
  level: number | null;
  status: string;
  anchors: number | null;
  answers: number | null;
  videos: number | null;
  created: string;
  premiumUntil: string;
  premiumSource: string;
};

type DashboardMetricsRow = {
  total_users: number | null;
  active_users: number | null;
  premium_users: number | null;
  free_users: number | null;
  deleted_users: number | null;
  activated_legacies: number | null;
};

function formatInterlinkCode(number: number) {
  return `IL-${String(number).padStart(7, "0").replace(
    /^(\d)(\d{3})(\d{3})$/,
    "$1.$2.$3"
  )}`;
}

function formatPremiumDate(value: string | null) {
  if (!value) return "Sin vencimiento";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCreatedDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatAccountStatus(value: string | null) {
  const status = value?.trim().toLowerCase();

  if (!status) return "Sin dato";
  if (status === "active" || status === "activo") return "Activo";
  if (status === "deleted" || status === "eliminado") return "Eliminado";
  if (status === "suspended" || status === "suspendido") return "Suspendido";
  if (status === "blocked" || status === "bloqueado") return "Bloqueado";

  return value ?? "Sin dato";
}

function formatAdminDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function youtubeEmbedUrl(value: string) {
  if (!value.trim()) return "";

  try {
    const url = new URL(value.trim());
    let videoId = "";

    if (url.hostname.includes("youtu.be")) {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2] ?? "";
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2] ?? "";
    } else {
      videoId = url.searchParams.get("v") ?? "";
    }

    return videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
      : "";
  } catch {
    return "";
  }
}

export default function Home() {
  const presentationVideoUrl = youtubeEmbedUrl(
    ADMIN_PRESENTATION_YOUTUBE_URL
  );
  const [authReady, setAuthReady] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("Resumen");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("Todos");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [premiumDays, setPremiumDays] = useState(30);
  const [premiumSource, setPremiumSource] = useState("admin_gift");
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumMessage, setPremiumMessage] = useState("");
  const [dashboardMetrics, setDashboardMetrics] =
    useState<DashboardMetricsRow | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [levelStats, setLevelStats] =
    useState<AdminLevelStatsRow | null>(null);
  const [levelStatsLoading, setLevelStatsLoading] = useState(true);
  const [levelStatsError, setLevelStatsError] = useState("");
  const [anchorStats, setAnchorStats] =
    useState<AdminAnchorStatsRow | null>(null);
  const [anchorStatsLoading, setAnchorStatsLoading] = useState(true);
  const [anchorStatsError, setAnchorStatsError] = useState("");
  const [anchorOverview, setAnchorOverview] =
    useState<AdminAnchorOverviewRow | null>(null);
  const [anchorOverviewLoading, setAnchorOverviewLoading] = useState(true);
  const [anchorOverviewError, setAnchorOverviewError] = useState("");
  const [anchorList, setAnchorList] = useState<AdminAnchorListRow[]>([]);
  const [anchorListLoading, setAnchorListLoading] = useState(true);
  const [anchorListError, setAnchorListError] = useState("");
  const [baseQuestions, setBaseQuestions] =
    useState<AdminBaseQuestionRow[]>([]);
  const [baseQuestionsLoading, setBaseQuestionsLoading] = useState(true);
  const [baseQuestionsError, setBaseQuestionsError] = useState("");
  const [baseQuestionSearch, setBaseQuestionSearch] = useState("");
  const [baseQuestionStageFilter, setBaseQuestionStageFilter] =
    useState("Todas");

  const [baseQuestionModal, setBaseQuestionModal] =
    useState<"add" | "edit" | null>(null);
  const [editingBaseQuestion, setEditingBaseQuestion] =
    useState<AdminBaseQuestionRow | null>(null);
  const [baseQuestionText, setBaseQuestionText] = useState("");
  const [baseQuestionStage, setBaseQuestionStage] = useState(1);
  const [baseQuestionEmoji, setBaseQuestionEmoji] = useState("");
  const [baseQuestionDescription, setBaseQuestionDescription] = useState("");
  const [baseQuestionActionLoading, setBaseQuestionActionLoading] =
    useState(false);
  const [baseQuestionActionMessage, setBaseQuestionActionMessage] =
    useState("");

  const [premiumUsersList, setPremiumUsersList] =
    useState<AdminPremiumUserRow[]>([]);
  const [premiumUsersLoading, setPremiumUsersLoading] = useState(true);
  const [premiumUsersError, setPremiumUsersError] = useState("");
  const [premiumSearch, setPremiumSearch] = useState("");

  const [levelsRankings, setLevelsRankings] =
    useState<AdminLevelsRankingsRow | null>(null);
  const [levelsRankingsLoading, setLevelsRankingsLoading] = useState(true);
  const [levelsRankingsError, setLevelsRankingsError] = useState("");

  const [activityStats, setActivityStats] =
    useState<AdminActivityStatsRow | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");






  useEffect(() => {
    let active = true;

    async function comprobarSesion() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setAuthError(error.message);
        setAdminUserId(null);
        setAuthReady(true);
        return;
      }

      setAuthError("");
      setAdminUserId(session?.user.id ?? null);
      setAuthReady(true);
    }

    comprobarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthError("");
      setAdminUserId(session?.user.id ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setDashboardLoading(false);
      return;
    }

    async function cargarMetricasReales() {
      setDashboardLoading(true);
      setDashboardError("");

      const { data, error } = await supabase.rpc(
        "admin_dashboard_metrics"
      );

      if (error) {
        setDashboardMetrics(null);
        setDashboardError(error.message);
        setDashboardLoading(false);
        return;
      }

      const row = ((data ?? [])[0] ?? null) as DashboardMetricsRow | null;

      setDashboardMetrics(row);
      setDashboardLoading(false);
    }

    cargarMetricasReales();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setLevelStatsLoading(false);
      return;
    }

    async function cargarNivelesReales() {
      setLevelStatsLoading(true);
      setLevelStatsError("");

      const { data, error } = await supabase.rpc(
        "admin_level_stats"
      );

      if (error) {
        setLevelStats(null);
        setLevelStatsError(error.message);
        setLevelStatsLoading(false);
        return;
      }

      const row = ((data ?? [])[0] ?? null) as AdminLevelStatsRow | null;

      setLevelStats(row);
      setLevelStatsLoading(false);
    }

    cargarNivelesReales();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setAnchorStatsLoading(false);
      return;
    }

    async function cargarAnclajesReales() {
      setAnchorStatsLoading(true);
      setAnchorStatsError("");

      const { data, error } = await supabase.rpc(
        "admin_anchor_stats"
      );

      if (error) {
        setAnchorStats(null);
        setAnchorStatsError(error.message);
        setAnchorStatsLoading(false);
        return;
      }

      const row = ((data ?? [])[0] ?? null) as AdminAnchorStatsRow | null;

      setAnchorStats(row);
      setAnchorStatsLoading(false);
    }

    cargarAnclajesReales();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setAnchorOverviewLoading(false);
      return;
    }

    async function cargarResumenAnclajes() {
      setAnchorOverviewLoading(true);
      setAnchorOverviewError("");

      const { data, error } = await supabase.rpc(
        "admin_anchor_overview"
      );

      if (error) {
        setAnchorOverview(null);
        setAnchorOverviewError(error.message);
        setAnchorOverviewLoading(false);
        return;
      }

      const row = ((data ?? [])[0] ?? null) as AdminAnchorOverviewRow | null;

      setAnchorOverview(row);
      setAnchorOverviewLoading(false);
    }

    cargarResumenAnclajes();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setAnchorListLoading(false);
      return;
    }

    async function cargarListadoAnclajes() {
      setAnchorListLoading(true);
      setAnchorListError("");

      const { data, error } = await supabase.rpc(
        "admin_list_anchors"
      );

      if (error) {
        setAnchorList([]);
        setAnchorListError(error.message);
        setAnchorListLoading(false);
        return;
      }

      setAnchorList((data ?? []) as AdminAnchorListRow[]);
      setAnchorListLoading(false);
    }

    cargarListadoAnclajes();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setBaseQuestionsLoading(false);
      return;
    }

    async function cargarPreguntasBase() {
      setBaseQuestionsLoading(true);
      setBaseQuestionsError("");

      const { data, error } = await supabase.rpc(
        "admin_list_base_questions"
      );

      if (error) {
        setBaseQuestions([]);
        setBaseQuestionsError(error.message);
        setBaseQuestionsLoading(false);
        return;
      }

      setBaseQuestions((data ?? []) as AdminBaseQuestionRow[]);
      setBaseQuestionsLoading(false);
    }

    cargarPreguntasBase();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setPremiumUsersLoading(false);
      return;
    }

    async function cargarPremiumReales() {
      setPremiumUsersLoading(true);
      setPremiumUsersError("");

      const { data, error } = await supabase.rpc(
        "admin_list_premium_users"
      );

      if (error) {
        setPremiumUsersList([]);
        setPremiumUsersError(error.message);
        setPremiumUsersLoading(false);
        return;
      }

      setPremiumUsersList((data ?? []) as AdminPremiumUserRow[]);
      setPremiumUsersLoading(false);
    }

    cargarPremiumReales();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setLevelsRankingsLoading(false);
      return;
    }

    async function cargarNivelesYRankings() {
      setLevelsRankingsLoading(true);
      setLevelsRankingsError("");

      const { data, error } = await supabase.rpc(
        "admin_levels_and_rankings"
      );

      if (error) {
        setLevelsRankings(null);
        setLevelsRankingsError(error.message);
        setLevelsRankingsLoading(false);
        return;
      }

      const row = ((data ?? [])[0] ?? null) as AdminLevelsRankingsRow | null;

      setLevelsRankings(row);
      setLevelsRankingsLoading(false);
    }

    cargarNivelesYRankings();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setActivityLoading(false);
      return;
    }

    async function cargarActividadReal() {
      setActivityLoading(true);
      setActivityError("");

      const { data, error } = await supabase.rpc(
        "admin_activity_stats"
      );

      if (error) {
        setActivityStats(null);
        setActivityError(error.message);
        setActivityLoading(false);
        return;
      }

      const row = ((data ?? [])[0] ?? null) as AdminActivityStatsRow | null;

      setActivityStats(row);
      setActivityLoading(false);
    }

    cargarActividadReal();
  }, [authReady, adminUserId]);

  useEffect(() => {
    if (!authReady || !adminUserId) {
      setUsersLoading(false);
      return;
    }

    async function cargarUsuariosReales() {
      setUsersLoading(true);
      setUsersError("");

      const { data, error } = await supabase.rpc("admin_list_users");

      if (error) {
        setUsers([]);
        setUsersError(error.message);
        setUsersLoading(false);
        return;
      }

      const rows = (data ?? []) as AdminUserRow[];

      const mappedUsers: User[] = rows.map((row) => {
        const isPremium =
          row.plan === "premium" ||
          row.plan === "Premium" ||
          row.premium_status === "active";

        return {
          id: row.id,
          name: row.display_name?.trim() || "Sin nombre",
          code: formatInterlinkCode(row.interlink_number),
          plan: isPremium ? "Premium" : "Free",
          level: row.level,
          status: formatAccountStatus(row.account_status),
          anchors: null,
          answers: row.answers_count ?? 0,
          videos: row.videos_count ?? 0,
          created: formatCreatedDate(row.created_at),
          premiumUntil: isPremium
            ? formatPremiumDate(row.premium_expires_at)
            : "—",
          premiumSource: row.premium_source?.trim() || "—",
        };
      });

      setUsers(mappedUsers);
      setUsersLoading(false);
    }

    cargarUsuariosReales();
  }, [authReady, adminUserId]);

  async function cerrarSesion() {
    setAuthError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      return;
    }

    setAdminUserId(null);
    setLoginPassword("");
  }

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setAuthError(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message
      );
      setLoginLoading(false);
      return;
    }

    setLoginPassword("");
    setLoginLoading(false);
  }

  async function reloadUsers() {
    const { data, error } = await supabase.rpc("admin_list_users");

    if (error) {
      setUsersError(error.message);
      return;
    }

    const rows = (data ?? []) as AdminUserRow[];

    const mappedUsers: User[] = rows.map((row) => {
      const isPremium =
        row.plan === "premium" ||
        row.plan === "Premium" ||
        row.premium_status === "active";

      return {
        id: row.id,
        name: row.display_name?.trim() || "Sin nombre",
        code: formatInterlinkCode(row.interlink_number),
        plan: isPremium ? "Premium" : "Free",
        level: row.level,
        status: formatAccountStatus(row.account_status),
        anchors: null,
        answers: row.answers_count ?? 0,
        videos: row.videos_count ?? 0,
        created: formatCreatedDate(row.created_at),
        premiumUntil: isPremium
          ? formatPremiumDate(row.premium_expires_at)
          : "—",
        premiumSource: row.premium_source?.trim() || "—",
      };
    });

    setUsers(mappedUsers);

    if (selectedUser) {
      const refreshedSelected = mappedUsers.find(
        (user) => user.id === selectedUser.id
      );

      if (refreshedSelected) {
        setSelectedUser(refreshedSelected);
      }
    }
  }

  async function reloadBaseQuestions() {
    setBaseQuestionsLoading(true);
    setBaseQuestionsError("");

    const { data, error } = await supabase.rpc(
      "admin_list_base_questions"
    );

    if (error) {
      setBaseQuestions([]);
      setBaseQuestionsError(error.message);
      setBaseQuestionsLoading(false);
      return false;
    }

    setBaseQuestions((data ?? []) as AdminBaseQuestionRow[]);
    setBaseQuestionsLoading(false);
    return true;
  }

  function openAddBaseQuestion() {
    setEditingBaseQuestion(null);
    setBaseQuestionText("");
    setBaseQuestionStage(1);
    setBaseQuestionEmoji("");
    setBaseQuestionDescription("");
    setBaseQuestionActionMessage("");
    setBaseQuestionModal("add");
  }

  function openEditBaseQuestion(question: AdminBaseQuestionRow) {
    setEditingBaseQuestion(question);
    setBaseQuestionText(question.title ?? "");
    setBaseQuestionStage(question.stage ?? 1);
    setBaseQuestionEmoji("");
    setBaseQuestionDescription("");
    setBaseQuestionActionMessage("");
    setBaseQuestionModal("edit");
  }

  async function saveBaseQuestion() {
    if (baseQuestionActionLoading) return;

    const cleanText = baseQuestionText.trim();

    if (!cleanText) {
      setBaseQuestionActionMessage(
        "Error: Escribe el texto de la pregunta."
      );
      return;
    }

    setBaseQuestionActionLoading(true);
    setBaseQuestionActionMessage("");

    if (baseQuestionModal === "add") {
      const { error } = await supabase.rpc(
        "admin_add_base_question",
        {
          p_question_text: cleanText,
          p_stage: baseQuestionStage,
          p_emoji: baseQuestionEmoji.trim() || null,
          p_description: baseQuestionDescription.trim() || null,
        }
      );

      if (error) {
        setBaseQuestionActionMessage(`Error: ${error.message}`);
        setBaseQuestionActionLoading(false);
        return;
      }

      await reloadBaseQuestions();
      setBaseQuestionActionMessage(
        "Pregunta agregada correctamente al final de las preguntas base."
      );
      setBaseQuestionActionLoading(false);

      setTimeout(() => {
        setBaseQuestionModal(null);
        setBaseQuestionActionMessage("");
      }, 800);

      return;
    }

    if (!editingBaseQuestion) {
      setBaseQuestionActionMessage(
        "Error: No encontramos la pregunta que quieres editar."
      );
      setBaseQuestionActionLoading(false);
      return;
    }

    let confirmAnswered = false;

    if ((editingBaseQuestion.responses_count ?? 0) > 0) {
      confirmAnswered = window.confirm(
        `Esta pregunta ya tiene ${editingBaseQuestion.responses_count ?? 0} respuesta(s). ¿Confirmas que quieres cambiar su texto?`
      );

      if (!confirmAnswered) {
        setBaseQuestionActionLoading(false);
        return;
      }
    }

    const { error } = await supabase.rpc(
      "admin_update_base_question",
      {
        p_question_id: editingBaseQuestion.id,
        p_question_text: cleanText,
        p_emoji: baseQuestionEmoji.trim() || null,
        p_description: baseQuestionDescription.trim() || null,
        p_confirm_answered: confirmAnswered,
      }
    );

    if (error) {
      setBaseQuestionActionMessage(`Error: ${error.message}`);
      setBaseQuestionActionLoading(false);
      return;
    }

    await reloadBaseQuestions();
    setBaseQuestionActionMessage("Pregunta editada correctamente.");
    setBaseQuestionActionLoading(false);

    setTimeout(() => {
      setBaseQuestionModal(null);
      setEditingBaseQuestion(null);
      setBaseQuestionActionMessage("");
    }, 800);
  }

  async function toggleBaseQuestion(question: AdminBaseQuestionRow) {
    if (baseQuestionActionLoading) return;

    const nextActive = !Boolean(question.is_active);

    const confirmed = window.confirm(
      nextActive
        ? `¿Reactivar "${question.title ?? "esta pregunta"}"? Volverá a estar disponible en la app.`
        : `¿Desactivar "${question.title ?? "esta pregunta"}"? Mantendrá su posición e historial, pero dejará de estar disponible para nuevas respuestas.`
    );

    if (!confirmed) return;

    setBaseQuestionActionLoading(true);
    setBaseQuestionActionMessage("");

    const { error } = await supabase.rpc(
      "admin_set_base_question_active",
      {
        p_question_id: question.id,
        p_is_active: nextActive,
      }
    );

    if (error) {
      window.alert(`No pudimos cambiar el estado: ${error.message}`);
      setBaseQuestionActionLoading(false);
      return;
    }

    await reloadBaseQuestions();
    setBaseQuestionActionLoading(false);
  }

  async function grantPremiumToSelectedUser() {
    if (!selectedUser || premiumLoading) return;

    setPremiumLoading(true);
    setPremiumMessage("");

    const { error } = await supabase.rpc("grant_premium", {
      p_user_id: selectedUser.id,
      p_days: premiumDays,
      p_source: premiumSource,
    });

    if (error) {
      setPremiumMessage(`Error: ${error.message}`);
      setPremiumLoading(false);
      return;
    }

    await reloadUsers();
    setPremiumMessage("Premium otorgado correctamente.");
    setPremiumLoading(false);

    setTimeout(() => {
      setPremiumModalOpen(false);
      setPremiumMessage("");
    }, 700);
  }

  const dashboardTotal = dashboardMetrics?.total_users ?? 0;
  const dashboardActive = dashboardMetrics?.active_users ?? 0;
  const dashboardPremium = dashboardMetrics?.premium_users ?? 0;
  const dashboardFree = dashboardMetrics?.free_users ?? 0;
  const dashboardDeleted = dashboardMetrics?.deleted_users ?? 0;
  const dashboardLegacies = dashboardMetrics?.activated_legacies ?? 0;

  const milestones = [100, 1000, 10000, 100000, 1000000];
  const nextMilestone =
    milestones.find((milestone) => dashboardTotal < milestone) ??
    milestones[milestones.length - 1];

  const previousMilestone =
    [...milestones]
      .reverse()
      .find((milestone) => milestone <= dashboardTotal) ?? 0;

  const milestoneRange = Math.max(nextMilestone - previousMilestone, 1);
  const milestoneProgress = Math.min(
    Math.max(
      ((dashboardTotal - previousMilestone) / milestoneRange) * 100,
      0
    ),
    100
  );

  const remainingToMilestone = Math.max(
    nextMilestone - dashboardTotal,
    0
  );

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("es-CL").format(value);

  const kpis = [
    {
      title: "ACTIVAS",
      value: dashboardLoading ? "…" : formatNumber(dashboardActive),
      detail:
        dashboardTotal > 0
          ? `${Math.round((dashboardActive / dashboardTotal) * 100)}% del total`
          : "0% del total",
      icon: "◉",
      glow: "text-cyan-300",
    },
    {
      title: "PREMIUM",
      value: dashboardLoading ? "…" : formatNumber(dashboardPremium),
      detail:
        dashboardActive > 0
          ? `${((dashboardPremium / dashboardActive) * 100).toFixed(1).replace(".", ",")}% activas`
          : "0% activas",
      icon: "◆",
      glow: "text-purple-300",
    },
    {
      title: "FREE",
      value: dashboardLoading ? "…" : formatNumber(dashboardFree),
      detail:
        dashboardActive > 0
          ? `${((dashboardFree / dashboardActive) * 100).toFixed(1).replace(".", ",")}% activas`
          : "0% activas",
      icon: "◇",
      glow: "text-blue-300",
    },
    {
      title: "ELIMINADAS",
      value: dashboardLoading ? "…" : formatNumber(dashboardDeleted),
      detail: "Históricas",
      icon: "⊘",
      glow: "text-slate-400",
    },
    {
      title: "LEGADOS ACTIVADOS",
      value: dashboardLoading ? "…" : formatNumber(dashboardLegacies),
      detail: "Accesos habilitados",
      icon: "✦",
      glow: "text-cyan-300",
    },
  ];

  const anchorRows = [
    { amount: 0, users: anchorStats?.anchors_0 ?? 0 },
    { amount: 1, users: anchorStats?.anchors_1 ?? 0 },
    { amount: 2, users: anchorStats?.anchors_2 ?? 0 },
    { amount: 3, users: anchorStats?.anchors_3 ?? 0 },
    { amount: 4, users: anchorStats?.anchors_4 ?? 0 },
    { amount: 5, users: anchorStats?.anchors_5 ?? 0 },
  ];

  const maxAnchorUsers = Math.max(
    ...anchorRows.map((item) => item.users),
    1
  );

  const anchors = anchorRows.map((item) => ({
    ...item,
    percent: Math.round((item.users / maxAnchorUsers) * 100),
  }));

  const totalActiveAnchors = anchorStats?.total_active_anchors ?? 0;
  const freeActiveAnchors = anchorStats?.free_active_anchors ?? 0;
  const premiumActiveAnchors = anchorStats?.premium_active_anchors ?? 0;

  const levelRows = [
    { level: 1, users: levelStats?.level_1 ?? 0 },
    { level: 5, users: levelStats?.level_5 ?? 0 },
    { level: 10, users: levelStats?.level_10 ?? 0 },
    { level: 15, users: levelStats?.level_15 ?? 0 },
    { level: 20, users: levelStats?.level_20 ?? 0 },
    { level: 25, users: levelStats?.level_25 ?? 0 },
    { level: 31, users: levelStats?.level_31 ?? 0 },
  ];

  const maxLevelUsers = Math.max(
    ...levelRows.map((item) => item.users),
    1
  );

  const levels = levelRows.map((item) => ({
    ...item,
    percent: Math.round((item.users / maxLevelUsers) * 100),
  }));

  const mostCommonLevel = levelStats?.most_common_level ?? 0;
  const averageLevel = Number(levelStats?.average_level ?? 0);
  const usersAtLevel31 = levelStats?.users_at_level_31 ?? 0;

  const overviewActiveAnchors = anchorOverview?.active_anchors ?? 0;
  const overviewHistoricalAnchors = anchorOverview?.historical_anchors ?? 0;
  const overviewRemovedAnchors = anchorOverview?.removed_anchors ?? 0;
  const overviewLinkedUsers = anchorOverview?.linked_users ?? 0;
  const overviewAverageAnchors = Number(
    anchorOverview?.average_anchors_per_active_user ?? 0
  );

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "Activo").length;
  const premiumUsers = users.filter((user) => user.plan === "Premium").length;
  const freeUsers = users.filter((user) => user.plan === "Free").length;

  const premiumNow = new Date();

  const filteredPremiumUsers = premiumUsersList.filter((user) => {
    const searchValue = premiumSearch.trim().toLowerCase();

    if (!searchValue) return true;

    const code = formatInterlinkCode(user.interlink_number).toLowerCase();
    const normalizedSearch = searchValue.replace(/\D/g, "");
    const normalizedCode = code.replace(/\D/g, "");

    return (
      (user.display_name ?? "").toLowerCase().includes(searchValue) ||
      code.includes(searchValue) ||
      (normalizedSearch !== "" && normalizedCode.endsWith(normalizedSearch)) ||
      (user.premium_source ?? "").toLowerCase().includes(searchValue)
    );
  });

  const premiumWithExpiry = premiumUsersList.filter(
    (user) => Boolean(user.premium_expires_at)
  ).length;

  const premiumWithoutExpiry =
    premiumUsersList.length - premiumWithExpiry;

  const premiumExpiring30Days = premiumUsersList.filter((user) => {
    if (!user.premium_expires_at) return false;

    const expiry = new Date(user.premium_expires_at);
    const diffMs = expiry.getTime() - premiumNow.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const dynamicMaxLevel =
    levelsRankings?.active_base_questions ?? 0;

  const rankingRows = [
    { label: "1+ respuestas", value: levelsRankings?.users_level_1_plus ?? 0, threshold: 1 },
    { label: "5+ respuestas", value: levelsRankings?.users_level_5_plus ?? 0, threshold: 5 },
    { label: "10+ respuestas", value: levelsRankings?.users_level_10_plus ?? 0, threshold: 10 },
    { label: "20+ respuestas", value: levelsRankings?.users_level_20_plus ?? 0, threshold: 20 },
    { label: "30+ respuestas", value: levelsRankings?.users_level_30_plus ?? 0, threshold: 30 },
    { label: "50+ respuestas", value: levelsRankings?.users_level_50_plus ?? 0, threshold: 50 },
    { label: "70+ respuestas", value: levelsRankings?.users_level_70_plus ?? 0, threshold: 70 },
  ];

  const maxRankingUsers = Math.max(
    ...rankingRows.map((item) => item.value),
    1
  );

  const averageLevelSql107 = Number(levelsRankings?.average_level ?? 0);
  const mostCommonLevelSql107 = levelsRankings?.most_common_level ?? 0;
  const maxLevelReachedSql107 = levelsRankings?.max_level_reached ?? 0;
  const usersLevel0Sql107 = levelsRankings?.users_level_0 ?? 0;

  const activityTotalResponses = Number(activityStats?.total_responses ?? 0);
  const activityActiveResponses = Number(activityStats?.active_responses ?? 0);
  const activityUsersWithResponses = Number(activityStats?.users_with_responses ?? 0);
  const activityResponsesToday = Number(activityStats?.responses_today ?? 0);
  const activityResponses7 = Number(activityStats?.responses_last_7_days ?? 0);
  const activityResponses30 = Number(activityStats?.responses_last_30_days ?? 0);
  const activityUsers7 = Number(activityStats?.active_users_last_7_days ?? 0);
  const activityUsers30 = Number(activityStats?.active_users_last_30_days ?? 0);

  const filteredUsers = users.filter((user) => {
    const searchValue = search.toLowerCase().trim();

    const normalizedSearch = searchValue.replace(/\D/g, "");
    const normalizedCode = user.code.replace(/\D/g, "");

    const matchesSearch =
      searchValue === "" ||
      user.name.toLowerCase().includes(searchValue) ||
      user.code.toLowerCase().includes(searchValue) ||
      (normalizedSearch !== "" &&
        normalizedCode.endsWith(normalizedSearch));

    const matchesPlan =
      planFilter === "Todos" || user.plan === planFilter;

    return matchesSearch && matchesPlan;
  });

  function changeSection(section: string) {
    setActiveSection(section);
    setSelectedUser(null);
  }

  const filteredBaseQuestions = baseQuestions.filter((question) => {
    const searchValue = baseQuestionSearch.trim().toLowerCase();

    const matchesSearch =
      searchValue === "" ||
      (question.title ?? "").toLowerCase().includes(searchValue) ||
      (question.question_key ?? "").toLowerCase().includes(searchValue) ||
      (question.category ?? "").toLowerCase().includes(searchValue);

    const matchesStage =
      baseQuestionStageFilter === "Todas" ||
      String(question.stage ?? "") === baseQuestionStageFilter;

    return matchesSearch && matchesStage;
  });

  const activeBaseQuestions = baseQuestions.filter(
    (question) => question.is_active
  ).length;

  const totalBaseResponses = baseQuestions.reduce(
    (sum, question) => sum + Number(question.responses_count ?? 0),
    0
  );

  const usersWith10PlusAnswers = users.filter(
    (user) => (user.answers ?? 0) >= 10
  ).length;

  function getMilestone(value: number) {
    const targets = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

    return (
      targets.find((target) => value < target) ??
      Math.ceil(Math.max(value, 1) / 10000) * 10000 + 10000
    );
  }

  function getSectionHero(section: string) {
    if (section === "Usuarios") {
      const value = totalUsers;
      const target = getMilestone(value);

      return {
        title: "USUARIOS REGISTRADOS",
        value: formatNumber(value),
        target,
        progress: Math.min((value / target) * 100, 100),
        message: `Faltan ${formatNumber(Math.max(target - value, 0))} usuarios para el próximo hito`,
      };
    }

    if (section === "Anclajes") {
      const value = overviewActiveAnchors;
      const target = getMilestone(value);

      return {
        title: "ANCLAJES ACTIVOS",
        value: formatNumber(value),
        target,
        progress: Math.min((value / target) * 100, 100),
        message: `Faltan ${formatNumber(Math.max(target - value, 0))} vínculos para el próximo hito`,
      };
    }

    if (section === "Legados") {
      const value = dashboardLegacies;
      const target = getMilestone(value);

      return {
        title: "LEGADOS ACTIVADOS",
        value: formatNumber(value),
        target,
        progress: Math.min((value / target) * 100, 100),
        message: `Faltan ${formatNumber(Math.max(target - value, 0))} legados para el próximo hito`,
      };
    }

    if (section === "Premium") {
      const value = dashboardPremium;
      const target = getMilestone(value);

      return {
        title: "PREMIUM ACTIVOS",
        value: formatNumber(value),
        target,
        progress: Math.min((value / target) * 100, 100),
        message: `Faltan ${formatNumber(Math.max(target - value, 0))} Premium para el próximo hito`,
      };
    }

    if (section === "Niveles") {
      const value = averageLevelSql107;
      const maxLevel = Math.max(dynamicMaxLevel, 1);

      return {
        title: "NIVEL PROMEDIO",
        value: value.toFixed(1).replace(".", ","),
        target: dynamicMaxLevel || null,
        progress: Math.min((value / maxLevel) * 100, 100),
        message:
          dynamicMaxLevel > 0
            ? `Promedio actual sobre ${formatNumber(dynamicMaxLevel)} preguntas base activas`
            : "Todavía no hay preguntas base activas",
      };
    }

    if (section === "Rankings") {
      const value = levelsRankings?.users_level_10_plus ?? 0;
      const base = Math.max(totalUsers, 1);

      return {
        title: "USUARIOS CON 10+ RESPUESTAS",
        value: formatNumber(value),
        target: totalUsers || null,
        progress: Math.min((value / base) * 100, 100),
        message:
          totalUsers > 0
            ? `${Math.round((value / totalUsers) * 100)}% de las cuentas llegó a 10+ respuestas`
            : "Todavía no hay usuarios para medir",
      };
    }

    if (section === "Preguntas Personalizadas") {
      const value = activeBaseQuestions;
      const total = Math.max(baseQuestions.length, 1);

      return {
        title: "PREGUNTAS BASE ACTIVAS",
        value: formatNumber(value),
        target: baseQuestions.length || null,
        progress: Math.min((value / total) * 100, 100),
        message:
          baseQuestions.length > 0
            ? `${formatNumber(totalBaseResponses)} respuestas activas registradas en preguntas base`
            : "Todavía no hay preguntas base cargadas",
      };
    }

    if (section === "Actividad") {
      const base = Math.max(totalUsers, 1);

      return {
        title: "USUARIOS ACTIVOS · 30 DÍAS",
        value: activityLoading ? "…" : formatNumber(activityUsers30),
        target: totalUsers || null,
        progress: Math.min((activityUsers30 / base) * 100, 100),
        message:
          totalUsers > 0
            ? `${Math.round((activityUsers30 / totalUsers) * 100)}% de las cuentas tuvo actividad en 30 días`
            : "Todavía no hay usuarios para medir actividad",
      };
    }

    if (section === "Pagos") {
      return {
        title: "PASARELA DE PAGOS",
        value: "OFF",
        target: null,
        progress: 0,
        message: "Todavía no existe integración real de cobros; no se muestran ingresos ficticios",
      };
    }

    if (section === "Logs & Seguridad") {
      return {
        title: "SEGURIDAD ADMIN",
        value: "OK",
        target: null,
        progress: 100,
        message: "Acceso administrativo protegido por Supabase Auth + autorización de administrador",
      };
    }

    return {
      title: "ESTADO DEL SISTEMA",
      value: "OK",
      target: null,
      progress: 100,
      message: "Configuración administrativa de INNERLINK",
    };
  }

  function renderModuleHero(section: string) {
    const hero = getSectionHero(section);

    return (
      <div className="mb-4 rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-[#04101f] via-[#061934] to-[#08132c] px-6 py-4 shadow-[0_0_35px_rgba(0,174,255,0.10)]">
        <div className="grid grid-cols-[1fr_180px] items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300">
              {hero.title}
            </p>

            <div className="mt-1 text-6xl font-bold leading-none text-cyan-50 drop-shadow-[0_0_18px_rgba(0,200,255,0.65)]">
              {hero.value}
            </div>

            <div className="mx-auto mt-4 h-2 max-w-[720px] overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_15px_rgba(80,150,255,0.8)]"
                style={{ width: `${hero.progress}%` }}
              />
            </div>

            <p className="mt-2 text-[10px] text-slate-500">
              {hero.message}
            </p>
          </div>

          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-cyan-500/15 bg-[#020812]/35 px-4 py-3 text-center">
            <p className="text-[9px] font-bold tracking-[0.14em] text-cyan-400">
              {hero.target ? "PRÓXIMO HITO" : "INDICADOR"}
            </p>

            <p className="mt-2 text-2xl font-bold text-cyan-100">
              {hero.target ? formatNumber(hero.target) : section}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020812] px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-cyan-500/20 bg-[#06111f] p-8 text-center shadow-[0_0_35px_rgba(0,174,255,0.10)]">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-cyan-400">
            INNERLINK · PANEL ADMINISTRATIVO
          </p>
          <h1 className="mt-4 text-2xl font-bold">Comprobando sesión…</h1>
          <p className="mt-3 text-sm text-slate-400">
            Esperando la autenticación segura antes de cargar los datos.
          </p>
        </div>
      </main>
    );
  }

  if (!adminUserId) {
    return (
      <main className="relative flex min-h-screen items-center overflow-hidden bg-[#020812] px-6 py-6 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/[0.055] blur-[110px]" />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.8fr)]">
          <section className="group relative w-full overflow-hidden rounded-[26px] border border-cyan-400/25 bg-[#04101e]/95 p-[1px] shadow-[0_0_55px_rgba(0,188,255,0.13)]">
            <div className="pointer-events-none absolute -left-20 -top-24 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl" />

            <div className="relative rounded-[25px] bg-gradient-to-b from-[#071827] to-[#020812] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.32em] text-cyan-300">
                    INNERLINK · CONEXIONES QUE TRASCIENDEN
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-white sm:text-lg">
                    Conoce nuestra historia
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_9px_rgba(103,232,249,0.9)]" />
                  <span className="text-[9px] font-bold tracking-[0.2em] text-cyan-200">
                    PRESENTACIÓN
                  </span>
                </div>
              </div>

              <div className="relative aspect-video overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#01050b] shadow-inner">
                {presentationVideoUrl ? (
                  <iframe
                    className="h-full w-full"
                    src={presentationVideoUrl}
                    title="Video de presentación de INNERLINK"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.10),transparent_58%)] px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.16)]">
                      <span className="ml-1 text-2xl text-cyan-200">▶</span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-cyan-100">
                      Video de presentación
                    </p>
                    <p className="mt-1 max-w-md text-xs text-slate-500">
                      El video aparecerá aquí cuando agregues su enlace de YouTube.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

        <div className="w-full max-w-md justify-self-center rounded-2xl border border-cyan-500/20 bg-[#06111f]/95 p-8 shadow-[0_0_35px_rgba(0,174,255,0.10)] backdrop-blur">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-cyan-400">
            INNERLINK · PANEL ADMINISTRATIVO
          </p>
          <h1 className="mt-4 text-2xl font-bold">Iniciar sesión</h1>
          <p className="mt-3 text-sm text-slate-400">
            Ingresa con tu cuenta administradora para abrir el panel.
          </p>
          <form className="mt-6 space-y-4" onSubmit={iniciarSesion}>
            <label className="block text-left">
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">
                Correo
              </span>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-xl border border-cyan-500/20 bg-[#020812] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70"
                placeholder="correo@ejemplo.com"
              />
            </label>
            <label className="block text-left">
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">
                Contraseña
              </span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-cyan-500/20 bg-[#020812] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70"
                placeholder="Tu contraseña"
              />
            </label>
            {authError && (
              <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-[#020812] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginLoading ? "Ingresando…" : "Ingresar al panel"}
            </button>
          </form>
        </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020812] text-white">

      {/* BARRA LATERAL */}
      <aside className="fixed left-0 top-0 h-screen w-[250px] border-r border-cyan-500/15 bg-[#020914] px-5 py-5">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">
            INNERLINK
          </h1>

          <p className="mt-1 text-[10px] font-semibold tracking-[0.28em] text-cyan-400">
            PANEL ADMINISTRATIVO
          </p>
        </div>

        <nav className="flex flex-col gap-0.5">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => changeSection(item)}
              className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition ${
                activeSection === item
                  ? "border border-cyan-400/60 bg-blue-500/10 text-cyan-300 shadow-[0_0_18px_rgba(0,200,255,0.16)]"
                  : "border border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* CERRAR SESIÓN */}
      <button
        onClick={cerrarSesion}
        className="fixed right-6 top-4 z-30 rounded-lg border border-white/10 bg-[#06111f] px-5 py-2 text-sm text-slate-400 transition hover:border-cyan-500/30 hover:text-white"
      >
        Cerrar sesión
      </button>

      {/* ===================== */}
      {/* RESUMEN */}
      {/* ===================== */}

      {activeSection === "Resumen" && (
        <section className="ml-[250px] h-screen overflow-hidden px-6 py-2">

          <div className="mb-2 flex h-[42px] items-center justify-between pr-36">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Datos en tiempo real
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-cyan-500/15 bg-[#06111f] px-4 py-2 text-xs text-slate-300">
                Sep 2026
              </button>

              <button className="rounded-lg border border-cyan-500/15 bg-[#06111f] px-4 py-2 text-xs text-slate-300">
                Filtros
              </button>

              <button className="rounded-lg border border-cyan-500/15 bg-[#06111f] px-4 py-2 text-xs text-slate-300">
                Exportar
              </button>
            </div>
          </div>

          {dashboardError && (
            <div className="mb-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[10px] text-red-300">
              No se pudieron cargar las métricas del resumen: {dashboardError}
            </div>
          )}

          {/* BLOQUE SUPERIOR */}
          <div className="grid h-[218px] grid-cols-[1fr_240px] gap-3">

            <div className="relative overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-[#04101f] via-[#061934] to-[#08132c] px-6 py-2 shadow-[0_0_35px_rgba(0,174,255,0.12)]">
              <div className="absolute left-1/2 top-0 h-28 w-80 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative z-10 grid h-full grid-cols-[150px_1fr_120px] items-center gap-5">

                <div className="space-y-2 text-xs text-slate-500">
                  {milestones.map((milestone) => (
                    <p
                      key={milestone}
                      className={
                        dashboardTotal >= milestone
                          ? "text-cyan-300"
                          : milestone === nextMilestone
                          ? "text-cyan-200"
                          : ""
                      }
                    >
                      ◇ {formatNumber(milestone)}
                    </p>
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-300">
                    CUENTAS CREADAS HISTÓRICAS
                  </p>

                  <div className="text-[92px] font-bold leading-[0.86] tracking-tight text-cyan-50 drop-shadow-[0_0_20px_rgba(0,200,255,0.9)]">
                    {dashboardLoading ? "…" : formatNumber(dashboardTotal)}
                  </div>

                  <p className="mt-3 text-xs text-cyan-300">
                    ¡Vamos por {formatNumber(nextMilestone)}! 🚀
                  </p>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_15px_rgba(80,150,255,0.8)]"
                      style={{ width: `${milestoneProgress}%` }}
                    />
                  </div>

                  <p className="mt-1 text-[10px] text-slate-500">
                    {dashboardLoading
                      ? "Cargando métricas reales..."
                      : remainingToMilestone === 0
                      ? "Hito alcanzado"
                      : `Faltan ${formatNumber(remainingToMilestone)} cuenta${
                          remainingToMilestone === 1 ? "" : "s"
                        } para el próximo hito`}
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-500/5 text-2xl shadow-[0_0_20px_rgba(0,200,255,0.18)]">
                    👥
                  </div>
                </div>

              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-500/20 bg-[#06111f] px-5 py-2 text-center shadow-[0_0_25px_rgba(0,174,255,0.06)]">
              <p className="text-[11px] font-semibold tracking-wide text-cyan-300">
                PRÓXIMO HITO
              </p>

              <div className="my-1 text-4xl">
                🏆
              </div>

              <p className="text-3xl font-bold text-cyan-100 drop-shadow-[0_0_12px_rgba(0,200,255,0.4)]">
                {formatNumber(nextMilestone)}
              </p>

              <p className="mt-1 text-[11px] text-cyan-400">
                CUENTAS CREADAS
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Celebración especial desbloqueada
              </p>
            </div>
          </div>

          {/* KPI */}
          <div className="mt-2 grid h-[116px] grid-cols-5 gap-3">
            {kpis.map((kpi) => (
              <div
                key={kpi.title}
                className="rounded-xl border border-cyan-500/15 bg-[#06111f] px-4 py-2.5 transition hover:border-cyan-400/35 hover:bg-[#07182a]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500">
                    {kpi.title}
                  </p>

                  <span className={`text-base ${kpi.glow}`}>
                    {kpi.icon}
                  </span>
                </div>

                <p className={`mt-1 text-3xl font-bold tracking-tight ${kpi.glow}`}>
                  {kpi.value}
                </p>

                <div className="mt-1.5 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />

                <p className="mt-1 text-[10px] text-slate-500">
                  {kpi.detail}
                </p>
              </div>
            ))}
          </div>

          {/* ANCLAJES + NIVELES */}
          <div className="mt-2 grid h-[310px] grid-cols-2 gap-4">

            <div className="rounded-2xl border border-cyan-500/15 bg-[#06111f] p-2.5">
              <div className="mb-1.5 flex items-start justify-between">

                <div>
                  <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">
                    ANCLAJES
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Distribución de personas ancladas por usuario
                  </p>

                  {anchorStatsError && (
                    <p className="mt-1 text-[9px] text-red-300">
                      Error cargando anclajes: {anchorStatsError}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-100">
                    {anchorStatsLoading ? "…" : formatNumber(totalActiveAnchors)}
                  </p>

                  <p className="text-[9px] text-slate-500">
                    ANCLAJES TOTALES
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                {anchors.map((anchor) => (
                  <div
                    key={anchor.amount}
                    className="grid grid-cols-[80px_1fr_55px] items-center gap-3"
                  >
                    <p className="text-xs text-slate-400">
                      {anchor.amount}{" "}
                      {anchor.amount === 1 ? "anclaje" : "anclajes"}
                    </p>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{ width: `${anchor.percent}%` }}
                      />
                    </div>

                    <p className="text-right text-xs font-semibold text-slate-300">
                      {anchor.users}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-1.5 grid grid-cols-2 gap-3 border-t border-white/5 pt-1.5">
                <div className="rounded-lg bg-[#020812]/60 px-3 py-1">
                  <p className="text-[9px] tracking-wider text-slate-500">
                    FREE
                  </p>

                  <p className="text-lg font-bold text-blue-300">
                    {anchorStatsLoading ? "…" : formatNumber(freeActiveAnchors)}
                  </p>

                  <p className="text-[9px] text-slate-600">
                    anclajes activos
                  </p>
                </div>

                <div className="rounded-lg bg-[#020812]/60 px-3 py-1">
                  <p className="text-[9px] tracking-wider text-slate-500">
                    PREMIUM
                  </p>

                  <p className="text-lg font-bold text-purple-300">
                    {anchorStatsLoading ? "…" : formatNumber(premiumActiveAnchors)}
                  </p>

                  <p className="text-[9px] text-slate-600">
                    anclajes activos
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/15 bg-[#06111f] p-2.5">
              <div className="mb-1.5 flex items-start justify-between">

                <div>
                  <p className="text-xs font-bold tracking-[0.15em] text-purple-300">
                    NIVEL DE USUARIOS
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Progreso actual de las cuentas activas
                  </p>

                  {levelStatsError && (
                    <p className="mt-1 text-[9px] text-red-300">
                      Error cargando niveles: {levelStatsError}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs text-purple-300">
                  Nivel 1–{levelsRankingsLoading ? "…" : dynamicMaxLevel || "—"}
                </div>
              </div>

              <div className="space-y-1">
                {levels.map((item) => (
                  <div
                    key={item.level}
                    className="grid grid-cols-[55px_1fr_55px] items-center gap-3"
                  >
                    <p className="text-xs font-semibold text-slate-400">
                      N{item.level}
                    </p>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>

                    <p className="text-right text-xs font-semibold text-slate-300">
                      {item.users}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-1.5 grid grid-cols-3 gap-3 border-t border-white/5 pt-1.5">

                <div>
                  <p className="text-[9px] text-slate-500">
                    NIVEL MÁS COMÚN
                  </p>

                  <p className="text-lg font-bold text-cyan-300">
                    {levelStatsLoading ? "…" : mostCommonLevel}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] text-slate-500">
                    NIVEL PROMEDIO
                  </p>

                  <p className="text-lg font-bold text-purple-300">
                    {levelStatsLoading
                      ? "…"
                      : averageLevel.toFixed(1).replace(".", ",")}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] text-slate-500">
                    NIVEL MÁX. ALCANZADO
                  </p>

                  <p className="text-lg font-bold text-cyan-100">
                    {levelsRankingsLoading ? "…" : maxLevelReachedSql107}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* ANCLAJES */}
      {/* ===================== */}

      {activeSection === "Anclajes" && (
        <section className="ml-[250px] h-screen overflow-hidden px-6 py-4">
          <div className="flex items-start justify-between pr-36">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                Anclajes
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Visualización segura de vínculos entre cuentas INNERLINK
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Datos en tiempo real
            </div>
          </div>

          {renderModuleHero("Anclajes")}

          <div className="grid grid-cols-5 gap-3">
            {[
              [
                "ACTIVOS",
                anchorOverviewLoading ? "…" : formatNumber(overviewActiveAnchors),
                "text-cyan-300",
              ],
              [
                "HISTÓRICOS",
                anchorOverviewLoading ? "…" : formatNumber(overviewHistoricalAnchors),
                "text-cyan-100",
              ],
              [
                "REMOVIDOS",
                anchorOverviewLoading ? "…" : formatNumber(overviewRemovedAnchors),
                "text-slate-400",
              ],
              [
                "USUARIOS VINCULADOS",
                anchorOverviewLoading ? "…" : formatNumber(overviewLinkedUsers),
                "text-purple-300",
              ],
              [
                "PROMEDIO / USUARIO",
                anchorOverviewLoading
                  ? "…"
                  : overviewAverageAnchors.toFixed(2).replace(".", ","),
                "text-blue-300",
              ],
            ].map(([title, value, color]) => (
              <div
                key={title}
                className="rounded-xl border border-cyan-500/20 bg-[#06111f] px-4 py-3"
              >
                <p className="text-[9px] font-semibold tracking-[0.12em] text-slate-500">
                  {title}
                </p>

                <p className={`mt-1 text-2xl font-bold ${color}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {(anchorOverviewError || anchorListError) && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
              {anchorOverviewError && (
                <p>Resumen: {anchorOverviewError}</p>
              )}
              {anchorListError && (
                <p>Listado: {anchorListError}</p>
              )}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#06111f]">
            <div className="grid grid-cols-[1.35fr_1.35fr_0.8fr_0.9fr_0.9fr] items-center border-b border-white/10 bg-[#081522] px-5 py-3">
              {[
                "SOLICITANTE",
                "RECEPTOR",
                "ESTADO",
                "CREADO",
                "RESPONDIDO",
              ].map((item) => (
                <p
                  key={item}
                  className="text-[9px] font-bold tracking-[0.13em] text-slate-500"
                >
                  {item}
                </p>
              ))}
            </div>

            {anchorListLoading && (
              <div className="flex h-40 items-center justify-center text-xs text-cyan-300">
                Cargando anclajes reales...
              </div>
            )}

            {!anchorListLoading &&
              !anchorListError &&
              anchorList.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <p className="text-sm font-semibold text-slate-300">
                    Todavía no existen vínculos creados
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Cuando dos cuentas se anclen, aparecerán aquí automáticamente.
                  </p>
                </div>
              )}

            {!anchorListLoading &&
              !anchorListError &&
              anchorList.map((anchor) => (
                <div
                  key={anchor.anchor_id}
                  className="grid grid-cols-[1.35fr_1.35fr_0.8fr_0.9fr_0.9fr] items-center border-b border-white/5 px-5 py-3 last:border-b-0"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {anchor.requester_name?.trim() || "Sin nombre"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-cyan-400">
                      {anchor.requester_interlink_number == null
                        ? "—"
                        : formatInterlinkCode(anchor.requester_interlink_number)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {anchor.receiver_name?.trim() || "Sin nombre"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-cyan-400">
                      {anchor.receiver_interlink_number == null
                        ? "—"
                        : formatInterlinkCode(anchor.receiver_interlink_number)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        anchor.removed_at
                          ? "bg-slate-600"
                          : "bg-emerald-400"
                      }`}
                    />
                    <p className="text-[10px] text-slate-400">
                      {anchor.removed_at
                        ? "Removido"
                        : anchor.anchor_status || "Activo"}
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    {formatAdminDate(anchor.created_at)}
                  </p>

                  <p className="text-[10px] text-slate-500">
                    {formatAdminDate(anchor.responded_at)}
                  </p>
                </div>
              ))}
          </div>

          <div className="mt-3 rounded-xl border border-white/5 bg-[#06111f]/70 px-4 py-3">
            <p className="text-[10px] leading-5 text-slate-600">
              Esta sección es solo de visualización administrativa. No permite
              crear, aceptar ni eliminar vínculos entre usuarios.
            </p>
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* USUARIOS */}
      {/* ===================== */}

      {activeSection === "Usuarios" && !selectedUser && (
        <section className="ml-[250px] h-screen overflow-hidden px-6 py-4">

          <div className="flex items-start justify-between pr-36">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                Usuarios
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Gestión y visualización de cuentas registradas
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Datos en tiempo real
            </div>
          </div>

          {renderModuleHero("Usuarios")}

          {/* KPIS */}
          <div className="grid grid-cols-4 gap-3">
            {[
              ["TOTAL USUARIOS", usersLoading ? "…" : String(totalUsers), "text-cyan-100"],
              ["ACTIVOS", usersLoading ? "…" : String(activeUsers), "text-cyan-300"],
              ["PREMIUM", usersLoading ? "…" : String(premiumUsers), "text-purple-300"],
              ["FREE", usersLoading ? "…" : String(freeUsers), "text-blue-300"],
            ].map(([title, value, color]) => (
              <div
                key={title}
                className="rounded-xl border border-cyan-500/20 bg-[#06111f] px-4 py-3"
              >
                <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500">
                  {title}
                </p>

                <p className={`mt-1 text-2xl font-bold ${color}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* BUSCADOR */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                ⌕
              </span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, IL-0.000.001 o simplemente 1..."
                className="h-11 w-full rounded-xl border border-cyan-500/15 bg-[#06111f] pl-11 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/60"
              />
            </div>

            {["Todos", "Premium", "Free"].map((filter) => (
              <button
                key={filter}
                onClick={() => setPlanFilter(filter)}
                className={`h-11 rounded-xl border px-4 text-xs transition ${
                  planFilter === filter
                    ? filter === "Premium"
                      ? "border-purple-400/50 bg-purple-500/10 text-purple-300"
                      : filter === "Free"
                      ? "border-blue-400/50 bg-blue-500/10 text-blue-300"
                      : "border-cyan-400/50 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-[#06111f] text-slate-400"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* TABLA */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#06111f]">

            <div className="grid grid-cols-[1.5fr_1.25fr_0.8fr_0.6fr_0.8fr_0.7fr_0.8fr_1fr_45px] items-center border-b border-white/10 bg-[#081522] px-5 py-3">
              {[
                "USUARIO",
                "CÓDIGO",
                "PLAN",
                "NIVEL",
                "ESTADO",
                "ANCLAJES",
                "RESPUESTAS",
                "REGISTRO",
                "",
              ].map((item, index) => (
                <p
                  key={`${item}-${index}`}
                  className="text-[9px] font-bold tracking-[0.13em] text-slate-500"
                >
                  {item}
                </p>
              ))}
            </div>

            {usersLoading && (
              <div className="flex h-32 items-center justify-center text-xs text-cyan-300">
                Cargando usuarios reales de INNERLINK...
              </div>
            )}

            {!usersLoading && usersError && (
              <div className="flex h-32 items-center justify-center px-6 text-center text-xs text-red-300">
                No se pudieron cargar los usuarios: {usersError}
              </div>
            )}

            {!usersLoading && !usersError && filteredUsers.length === 0 && (
              <div className="flex h-32 items-center justify-center text-xs text-slate-500">
                No se encontraron usuarios con ese filtro.
              </div>
            )}

            {!usersLoading && !usersError && filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="grid w-full grid-cols-[1.5fr_1.25fr_0.8fr_0.6fr_0.8fr_0.7fr_0.8fr_1fr_45px] items-center border-b border-white/5 px-5 py-3 text-left transition last:border-b-0 hover:bg-cyan-500/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/5 text-xs font-bold text-cyan-300">
                    {user.name.charAt(0)}
                  </div>

                  <p className="truncate text-xs font-semibold text-slate-200">
                    {user.name}
                  </p>
                </div>

                <p className="text-xs text-cyan-400">
                  {user.code}
                </p>

                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-bold ${
                    user.plan === "Premium"
                      ? "border border-purple-400/20 bg-purple-500/10 text-purple-300"
                      : "border border-blue-400/20 bg-blue-500/10 text-blue-300"
                  }`}
                >
                  {user.plan.toUpperCase()}
                </span>

                <p className="text-xs font-bold text-slate-300">
                  {user.level ?? "—"}
                </p>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      user.status === "Activo"
                        ? "bg-emerald-400"
                        : "bg-slate-600"
                    }`}
                  />

                  <p className="text-[10px] text-slate-400">
                    {user.status}
                  </p>
                </div>

                <p className="text-xs text-slate-300">
                  {user.anchors ?? "—"}
                </p>

                <p className="text-xs text-slate-300">
                  {user.answers ?? "—"}
                </p>

                <p className="text-[10px] text-slate-500">
                  {user.created}
                </p>

                <span className="text-xl text-cyan-400">
                  ›
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* FICHA DE USUARIO */}
      {/* ===================== */}

      {activeSection === "Usuarios" && selectedUser && (
        <section className="ml-[250px] h-screen overflow-hidden px-6 py-4">

          {/* VOLVER */}
          <button
            onClick={() => setSelectedUser(null)}
            className="mb-4 rounded-lg border border-white/10 bg-[#06111f] px-4 py-2 text-xs text-slate-400 transition hover:border-cyan-400/30 hover:text-white"
          >
            ← Volver a Usuarios
          </button>

          {/* CABECERA USUARIO */}
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-[#06111f] to-[#07162a] p-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/5 text-2xl font-bold text-cyan-300">
                  {selectedUser.name.charAt(0)}
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-400">
                    CUENTA INNERLINK
                  </p>

                  <h2 className="mt-1 text-3xl font-bold">
                    {selectedUser.name}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-cyan-400">
                    {selectedUser.code}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedUser.status === "Activo"
                        ? "bg-emerald-400"
                        : "bg-slate-600"
                    }`}
                  />

                  <p className="text-xs text-slate-400">
                    {selectedUser.status}
                  </p>
                </div>

                <span
                  className={`mt-3 inline-flex rounded-full px-4 py-1.5 text-xs font-bold ${
                    selectedUser.plan === "Premium"
                      ? "border border-purple-400/30 bg-purple-500/10 text-purple-300"
                      : "border border-blue-400/30 bg-blue-500/10 text-blue-300"
                  }`}
                >
                  {selectedUser.plan.toUpperCase()}
                </span>
              </div>

            </div>
          </div>

          {/* DATOS PRINCIPALES */}
          <div className="mt-4 grid grid-cols-4 gap-3">

            <div className="rounded-xl border border-cyan-500/15 bg-[#06111f] p-4">
              <p className="text-[9px] font-bold tracking-wider text-slate-500">
                NIVEL
              </p>

              <p className="mt-2 text-3xl font-bold text-cyan-300">
                {selectedUser.level ?? "—"}
              </p>

              <p className="text-[10px] text-slate-600">
                de {levelsRankingsLoading ? "…" : dynamicMaxLevel || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/15 bg-[#06111f] p-4">
              <p className="text-[9px] font-bold tracking-wider text-slate-500">
                ANCLAJES
              </p>

              <p className="mt-2 text-3xl font-bold text-cyan-100">
                {selectedUser.anchors ?? "—"}
              </p>

              <p className="text-[10px] text-slate-600">
                personas
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/15 bg-[#06111f] p-4">
              <p className="text-[9px] font-bold tracking-wider text-slate-500">
                RESPUESTAS
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-300">
                {selectedUser.answers ?? "—"}
              </p>

              <p className="text-[10px] text-slate-600">
                completadas
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/15 bg-[#06111f] p-4">
              <p className="text-[9px] font-bold tracking-wider text-slate-500">
                VIDEOS
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-300">
                {selectedUser.videos ?? "—"}
              </p>

              <p className="text-[10px] text-slate-600">
                almacenados
              </p>
            </div>

          </div>

          {/* INFORMACIÓN + PREMIUM */}
          <div className="mt-4 grid grid-cols-[1fr_360px] gap-4">

            {/* INFORMACIÓN */}
            <div className="rounded-2xl border border-cyan-500/15 bg-[#06111f] p-5">

              <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">
                INFORMACIÓN DE LA CUENTA
              </p>

              <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5">

                <div>
                  <p className="text-[9px] font-bold text-slate-600">
                    NOMBRE
                  </p>

                  <p className="mt-1 text-sm text-slate-200">
                    {selectedUser.name}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-slate-600">
                    CÓDIGO INNERLINK
                  </p>

                  <p className="mt-1 text-sm font-semibold text-cyan-400">
                    {selectedUser.code}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-slate-600">
                    FECHA DE REGISTRO
                  </p>

                  <p className="mt-1 text-sm text-slate-200">
                    {selectedUser.created}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-slate-600">
                    ESTADO
                  </p>

                  <p
                    className={`mt-1 text-sm ${
                      selectedUser.status === "Activo"
                        ? "text-emerald-300"
                        : "text-slate-400"
                    }`}
                  >
                    {selectedUser.status}
                  </p>
                </div>

              </div>

              <div className="mt-6 border-t border-white/5 pt-4">
                <p className="text-[10px] leading-5 text-slate-600">
                  El panel administrativo muestra información operativa y
                  estadísticas de la cuenta. Los videos privados del usuario
                  no se muestran desde esta sección.
                </p>
              </div>

            </div>

            {/* PREMIUM */}
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#08101e] to-[#100b20] p-5">

              <p className="text-xs font-bold tracking-[0.15em] text-purple-300">
                PREMIUM
              </p>

              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-[9px] font-bold text-slate-600">
                    ESTADO
                  </p>

                  <p
                    className={`mt-1 text-lg font-bold ${
                      selectedUser.plan === "Premium"
                        ? "text-purple-300"
                        : "text-slate-400"
                    }`}
                  >
                    {selectedUser.plan === "Premium"
                      ? "Premium activo"
                      : "Sin Premium"}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-slate-600">
                    VENCIMIENTO
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {selectedUser.premiumUntil}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-slate-600">
                    ORIGEN
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {selectedUser.premiumSource}
                  </p>
                </div>

              </div>

              <div className="mt-6">

                {selectedUser.plan === "Premium" ? (
                  <button
                    disabled
                    className="w-full cursor-default rounded-xl border border-purple-400/30 bg-purple-500/10 py-3 text-xs font-bold text-purple-300"
                  >
                    ◆ PREMIUM ACTIVO
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPremiumDays(30);
                      setPremiumSource("admin_gift");
                      setPremiumMessage("");
                      setPremiumModalOpen(true);
                    }}
                    className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/10 py-3 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    DAR PREMIUM
                  </button>
                )}

                <p className="mt-3 text-center text-[9px] leading-4 text-slate-600">
                  Otorgamiento protegido mediante el sistema seguro de
                  administración Premium.
                </p>

              </div>
            </div>

          </div>

        </section>
      )}

      {premiumModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-3xl border border-purple-400/25 bg-[#07101d] p-6 shadow-[0_0_50px_rgba(168,85,247,0.14)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.22em] text-purple-300">
                  INNERLINK PREMIUM
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  Dar Premium
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedUser.name} · {selectedUser.code}
                </p>
              </div>

              <button
                onClick={() => {
                  if (!premiumLoading) {
                    setPremiumModalOpen(false);
                    setPremiumMessage("");
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-lg text-slate-500 transition hover:border-white/20 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <p className="text-[9px] font-bold tracking-[0.14em] text-slate-500">
                DURACIÓN
              </p>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { label: "30 días", value: 30 },
                  { label: "90 días", value: 90 },
                  { label: "1 año", value: 365 },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPremiumDays(option.value)}
                    className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
                      premiumDays === option.value
                        ? "border-purple-400/50 bg-purple-500/15 text-purple-200"
                        : "border-white/10 bg-[#020812] text-slate-400 hover:border-purple-400/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[9px] font-bold tracking-[0.14em] text-slate-500">
                ORIGEN
              </p>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { label: "Regalo admin", value: "admin_gift" },
                  { label: "Evento", value: "event" },
                  { label: "Promoción", value: "promotion" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPremiumSource(option.value)}
                    className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
                      premiumSource === option.value
                        ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
                        : "border-white/10 bg-[#020812] text-slate-400 hover:border-cyan-400/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/5 bg-[#020812]/70 px-4 py-3 text-[10px] leading-5 text-slate-500">
              Se otorgarán <span className="font-bold text-white">{premiumDays} días</span> de Premium.
              La acción quedará registrada en el historial de Premium de INNERLINK.
            </div>

            {premiumMessage && (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-xs ${
                  premiumMessage.startsWith("Error:")
                    ? "border-red-500/20 bg-red-500/5 text-red-300"
                    : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                }`}
              >
                {premiumMessage}
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (!premiumLoading) {
                    setPremiumModalOpen(false);
                    setPremiumMessage("");
                  }
                }}
                disabled={premiumLoading}
                className="rounded-xl border border-white/10 bg-[#020812] py-3 text-xs font-bold text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                CANCELAR
              </button>

              <button
                onClick={grantPremiumToSelectedUser}
                disabled={premiumLoading}
                className="rounded-xl border border-purple-400/40 bg-purple-500/10 py-3 text-xs font-bold text-purple-200 transition hover:bg-purple-500/20 disabled:cursor-wait disabled:opacity-60"
              >
                {premiumLoading ? "OTORGANDO..." : "CONFIRMAR PREMIUM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* NIVELES */}
      {/* ===================== */}

      {activeSection === "Niveles" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="flex items-start justify-between pr-36">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                Niveles
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Progreso real de las cuentas según respuestas completadas
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Datos en tiempo real
            </div>
          </div>

          <div className="mt-5">
            {renderModuleHero("Niveles")}
          </div>

          {levelsRankingsError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
              No se pudieron cargar los niveles: {levelsRankingsError}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {[
              [
                "PREGUNTAS ACTIVAS",
                levelsRankingsLoading ? "…" : formatNumber(dynamicMaxLevel),
                "text-cyan-300",
              ],
              [
                "NIVEL PROMEDIO",
                levelsRankingsLoading
                  ? "…"
                  : averageLevelSql107.toFixed(2).replace(".", ","),
                "text-purple-300",
              ],
              [
                "NIVEL MÁS COMÚN",
                levelsRankingsLoading ? "…" : formatNumber(mostCommonLevelSql107),
                "text-blue-300",
              ],
              [
                "MÁXIMO ALCANZADO",
                levelsRankingsLoading ? "…" : formatNumber(maxLevelReachedSql107),
                "text-cyan-100",
              ],
            ].map(([title, value, color]) => (
              <div
                key={title}
                className="rounded-xl border border-cyan-500/20 bg-[#06111f] px-4 py-3"
              >
                <p className="text-[9px] font-semibold tracking-[0.12em] text-slate-500">
                  {title}
                </p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-purple-500/15 bg-[#06111f] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-purple-300">
                  PROFUNDIDAD DE PROGRESO
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Cantidad de cuentas que alcanzaron al menos cada hito.
                </p>
              </div>

              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs text-purple-300">
                Máximo dinámico: {levelsRankingsLoading ? "…" : dynamicMaxLevel}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {rankingRows.map((row) => {
                const percent =
                  totalUsers > 0 ? Math.min((row.value / totalUsers) * 100, 100) : 0;

                return (
                  <div
                    key={row.threshold}
                    className="grid grid-cols-[120px_1fr_70px_70px] items-center gap-3"
                  >
                    <p className="text-xs font-semibold text-slate-400">
                      Nivel {row.threshold}+
                    </p>

                    <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-right text-xs font-bold text-slate-200">
                      {levelsRankingsLoading ? "…" : formatNumber(row.value)}
                    </p>

                    <p className="text-right text-[10px] text-slate-500">
                      {levelsRankingsLoading
                        ? "…"
                        : `${Math.round(percent)}%`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
              <div className="rounded-xl bg-[#020812]/60 px-4 py-3">
                <p className="text-[9px] tracking-wider text-slate-500">
                  NIVEL 0
                </p>
                <p className="mt-1 text-xl font-bold text-slate-300">
                  {levelsRankingsLoading ? "…" : formatNumber(usersLevel0Sql107)}
                </p>
                <p className="mt-1 text-[9px] text-slate-600">
                  cuentas sin respuestas
                </p>
              </div>

              <div className="rounded-xl bg-[#020812]/60 px-4 py-3">
                <p className="text-[9px] tracking-wider text-slate-500">
                  MÁXIMO ALCANZADO
                </p>
                <p className="mt-1 text-xl font-bold text-cyan-300">
                  {levelsRankingsLoading ? "…" : formatNumber(maxLevelReachedSql107)}
                </p>
                <p className="mt-1 text-[9px] text-slate-600">
                  nivel real más alto entre cuentas activas
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* RANKINGS */}
      {/* ===================== */}

      {activeSection === "Rankings" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="flex items-start justify-between pr-36">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                Rankings
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Profundidad de uso: cuántas personas realmente avanzan en INNERLINK
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Datos en tiempo real
            </div>
          </div>

          <div className="mt-5">
            {renderModuleHero("Rankings")}
          </div>

          {levelsRankingsError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
              No se pudieron cargar los rankings: {levelsRankingsError}
            </div>
          )}

          <div className="rounded-2xl border border-cyan-500/15 bg-[#06111f] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">
                  EMBUDO DE RESPUESTAS
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Cada grupo incluye a quienes alcanzaron ese número o más de respuestas.
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-100">
                  {formatNumber(totalUsers)}
                </p>
                <p className="text-[9px] text-slate-500">
                  CUENTAS TOTALES
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {rankingRows.map((row) => {
                const percent =
                  totalUsers > 0 ? Math.min((row.value / totalUsers) * 100, 100) : 0;

                return (
                  <div
                    key={row.threshold}
                    className="grid grid-cols-[130px_1fr_90px_70px] items-center gap-4"
                  >
                    <p className="text-xs font-semibold text-slate-300">
                      {row.label}
                    </p>

                    <div className="h-3 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_12px_rgba(80,150,255,0.35)]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-right text-sm font-bold text-purple-200">
                      {levelsRankingsLoading ? "…" : formatNumber(row.value)}
                    </p>

                    <p className="text-right text-[10px] text-slate-500">
                      {levelsRankingsLoading
                        ? "…"
                        : `${Math.round(percent)}%`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/5 bg-[#06111f] px-4 py-3">
              <p className="text-[9px] tracking-wider text-slate-500">
                SIN RESPUESTAS
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-300">
                {levelsRankingsLoading ? "…" : formatNumber(usersLevel0Sql107)}
              </p>
            </div>

            <div className="rounded-xl border border-purple-500/15 bg-[#06111f] px-4 py-3">
              <p className="text-[9px] tracking-wider text-slate-500">
                10+ RESPUESTAS
              </p>
              <p className="mt-1 text-2xl font-bold text-purple-300">
                {levelsRankingsLoading
                  ? "…"
                  : formatNumber(levelsRankings?.users_level_10_plus ?? 0)}
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/15 bg-[#06111f] px-4 py-3">
              <p className="text-[9px] tracking-wider text-slate-500">
                70+ RESPUESTAS
              </p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">
                {levelsRankingsLoading
                  ? "…"
                  : formatNumber(levelsRankings?.users_level_70_plus ?? 0)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* PREMIUM */}
      {/* ===================== */}

      {activeSection === "Premium" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="flex items-start justify-between pr-36">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                Premium
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Gestión y visualización de cuentas Premium activas
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Datos en tiempo real
            </div>
          </div>

          <div className="mt-5">
            {renderModuleHero("Premium")}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              [
                "PREMIUM ACTIVOS",
                premiumUsersLoading ? "…" : formatNumber(premiumUsersList.length),
                "text-purple-300",
              ],
              [
                "CON VENCIMIENTO",
                premiumUsersLoading ? "…" : formatNumber(premiumWithExpiry),
                "text-cyan-300",
              ],
              [
                "SIN VENCIMIENTO",
                premiumUsersLoading ? "…" : formatNumber(premiumWithoutExpiry),
                "text-blue-300",
              ],
              [
                "VENCEN ≤ 30 DÍAS",
                premiumUsersLoading ? "…" : formatNumber(premiumExpiring30Days),
                "text-amber-300",
              ],
            ].map(([title, value, color]) => (
              <div
                key={title}
                className="rounded-xl border border-purple-500/20 bg-[#06111f] px-4 py-3"
              >
                <p className="text-[9px] font-semibold tracking-[0.12em] text-slate-500">
                  {title}
                </p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                ⌕
              </span>

              <input
                value={premiumSearch}
                onChange={(event) => setPremiumSearch(event.target.value)}
                placeholder="Buscar por nombre, código INNERLINK u origen Premium..."
                className="h-11 w-full rounded-xl border border-purple-500/20 bg-[#06111f] pl-11 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-purple-400/60"
              />
            </div>
          </div>

          {premiumUsersError && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
              No se pudieron cargar las cuentas Premium: {premiumUsersError}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-purple-500/20 bg-[#06111f]">
            <div className="grid grid-cols-[1.4fr_1fr_0.65fr_0.9fr_1fr_0.9fr_50px] items-center border-b border-white/10 bg-[#0b1020] px-5 py-3">
              {[
                "USUARIO",
                "CÓDIGO",
                "NIVEL",
                "INICIO",
                "VENCIMIENTO",
                "ORIGEN",
                "",
              ].map((item, index) => (
                <p
                  key={`${item}-${index}`}
                  className="text-[9px] font-bold tracking-[0.12em] text-slate-500"
                >
                  {item}
                </p>
              ))}
            </div>

            {premiumUsersLoading && (
              <div className="flex h-40 items-center justify-center text-xs text-purple-300">
                Cargando cuentas Premium...
              </div>
            )}

            {!premiumUsersLoading &&
              !premiumUsersError &&
              filteredPremiumUsers.length === 0 && (
                <div className="flex h-40 items-center justify-center text-xs text-slate-500">
                  No se encontraron cuentas Premium.
                </div>
              )}

            {!premiumUsersLoading &&
              !premiumUsersError &&
              filteredPremiumUsers.map((premiumUser) => {
                const linkedUser = users.find(
                  (user) => user.id === premiumUser.id
                );

                return (
                  <button
                    key={premiumUser.id}
                    onClick={() => {
                      if (linkedUser) {
                        setSelectedUser(linkedUser);
                        setActiveSection("Usuarios");
                      }
                    }}
                    className="grid w-full grid-cols-[1.4fr_1fr_0.65fr_0.9fr_1fr_0.9fr_50px] items-center border-b border-white/5 px-5 py-3 text-left transition last:border-b-0 hover:bg-purple-500/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-400/30 bg-purple-500/5 text-xs font-bold text-purple-300">
                        {(premiumUser.display_name?.trim() || "U").charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-200">
                          {premiumUser.display_name?.trim() || "Sin nombre"}
                        </p>

                        <p className="mt-0.5 text-[9px] text-purple-400">
                          {(premiumUser.premium_status ?? "active").toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-cyan-400">
                      {formatInterlinkCode(premiumUser.interlink_number)}
                    </p>

                    <p className="text-xs font-bold text-slate-300">
                      {premiumUser.level ?? "—"}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      {formatCreatedDate(premiumUser.premium_started_at)}
                    </p>

                    <div>
                      <p className="text-[10px] text-slate-300">
                        {formatPremiumDate(premiumUser.premium_expires_at)}
                      </p>

                      {premiumUser.premium_expires_at && (
                        <p className="mt-0.5 text-[9px] text-slate-600">
                          {new Date(premiumUser.premium_expires_at) > premiumNow
                            ? "Activo"
                            : "Vencido"}
                        </p>
                      )}
                    </div>

                    <span className="w-fit rounded-full border border-purple-400/20 bg-purple-500/10 px-2.5 py-1 text-[9px] font-bold text-purple-300">
                      {premiumUser.premium_source?.trim() || "—"}
                    </span>

                    <span className="text-xl text-purple-300">
                      ›
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="mt-3 rounded-xl border border-white/5 bg-[#06111f]/70 px-4 py-3">
            <p className="text-[10px] leading-5 text-slate-600">
              Haz clic en una cuenta Premium para abrir su ficha completa en Usuarios.
              El otorgamiento manual de Premium sigue protegido desde la ficha individual.
            </p>
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* PREGUNTAS BASE */}
      {/* ===================== */}

      {activeSection === "Preguntas Personalizadas" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="flex items-start justify-between pr-36">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                Preguntas Base
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Administración de las preguntas oficiales de INNERLINK
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Datos en tiempo real
            </div>
          </div>

          <div className="mt-5">
            {renderModuleHero("Preguntas Personalizadas")}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              [
                "TOTAL BASE",
                baseQuestionsLoading ? "…" : formatNumber(baseQuestions.length),
                "text-cyan-100",
              ],
              [
                "ACTIVAS",
                baseQuestionsLoading ? "…" : formatNumber(activeBaseQuestions),
                "text-cyan-300",
              ],
              [
                "RESPUESTAS",
                baseQuestionsLoading ? "…" : formatNumber(totalBaseResponses),
                "text-purple-300",
              ],
              [
                "INACTIVAS",
                baseQuestionsLoading
                  ? "…"
                  : formatNumber(
                      Math.max(baseQuestions.length - activeBaseQuestions, 0)
                    ),
                "text-slate-400",
              ],
            ].map(([title, value, color]) => (
              <div
                key={title}
                className="rounded-xl border border-cyan-500/20 bg-[#06111f] px-4 py-3"
              >
                <p className="text-[9px] font-semibold tracking-[0.12em] text-slate-500">
                  {title}
                </p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                ⌕
              </span>

              <input
                value={baseQuestionSearch}
                onChange={(event) =>
                  setBaseQuestionSearch(event.target.value)
                }
                placeholder="Buscar por título, key o categoría..."
                className="h-11 w-full rounded-xl border border-cyan-500/15 bg-[#06111f] pl-11 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/60"
              />
            </div>

            <select
              value={baseQuestionStageFilter}
              onChange={(event) =>
                setBaseQuestionStageFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-white/10 bg-[#06111f] px-4 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
            >
              <option value="Todas">Todas las etapas</option>
              {[1, 2, 3, 4, 5, 6, 7].map((stage) => (
                <option key={stage} value={String(stage)}>
                  Etapa {stage}
                </option>
              ))}
            </select>

            <button
              onClick={openAddBaseQuestion}
              className="h-11 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              + AGREGAR PREGUNTA
            </button>
          </div>

          {baseQuestionsError && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
              No se pudieron cargar las preguntas base: {baseQuestionsError}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#06111f]">
            <div className="grid grid-cols-[0.7fr_2.2fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr_1.1fr] items-center border-b border-white/10 bg-[#081522] px-5 py-3">
              {[
                "KEY",
                "PREGUNTA",
                "ETAPA",
                "ESTADO",
                "SUBPREG.",
                "RESPUESTAS",
                "ACCESO",
                "ACCIONES",
              ].map((item) => (
                <p
                  key={item}
                  className="text-[9px] font-bold tracking-[0.12em] text-slate-500"
                >
                  {item}
                </p>
              ))}
            </div>

            {baseQuestionsLoading && (
              <div className="flex h-40 items-center justify-center text-xs text-cyan-300">
                Cargando preguntas base...
              </div>
            )}

            {!baseQuestionsLoading &&
              !baseQuestionsError &&
              filteredBaseQuestions.length === 0 && (
                <div className="flex h-40 items-center justify-center text-xs text-slate-500">
                  No se encontraron preguntas con ese filtro.
                </div>
              )}

            {!baseQuestionsLoading &&
              !baseQuestionsError &&
              filteredBaseQuestions.map((question) => (
                <div
                  key={question.id}
                  className="grid grid-cols-[0.7fr_2.2fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr_1.1fr] items-center border-b border-white/5 px-5 py-3 last:border-b-0 hover:bg-cyan-500/[0.03]"
                >
                  <p className="truncate text-[10px] font-semibold text-cyan-400">
                    {question.question_key ?? "—"}
                  </p>

                  <div className="min-w-0 pr-4">
                    <p className="truncate text-xs font-semibold text-slate-200">
                      {question.title?.trim() || "Sin título"}
                    </p>
                    <p className="mt-0.5 truncate text-[9px] text-slate-600">
                      {question.category ?? "Sin categoría"}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300">
                    {question.stage ?? "—"}
                  </p>

                  <span
                    className={`w-fit rounded-full px-2 py-1 text-[9px] font-bold ${
                      question.is_active
                        ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                        : "border border-slate-500/20 bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {question.is_active ? "ACTIVA" : "INACTIVA"}
                  </span>

                  <p className="text-xs text-slate-300">
                    {question.subquestions_count ?? 0}
                  </p>

                  <p className="text-xs font-semibold text-purple-300">
                    {question.responses_count ?? 0}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    {question.access_level ?? "—"}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditBaseQuestion(question)}
                      disabled={baseQuestionActionLoading}
                      className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 text-[9px] font-bold text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
                    >
                      EDITAR
                    </button>

                    <button
                      onClick={() => toggleBaseQuestion(question)}
                      disabled={baseQuestionActionLoading}
                      className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-2.5 py-1.5 text-[9px] font-bold text-purple-300 transition hover:bg-purple-500/10 disabled:opacity-50"
                    >
                      {question.is_active ? "DESACT." : "ACTIVAR"}
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <p className="mt-3 text-[10px] text-slate-600">
            Las nuevas preguntas se agregan al final de la secuencia oficial. Desactivar nunca elimina ni reorganiza las existentes.
          </p>
        </section>
      )}

      {baseQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[620px] rounded-3xl border border-cyan-400/25 bg-[#07101d] p-6 shadow-[0_0_50px_rgba(0,200,255,0.12)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.22em] text-cyan-300">
                  PREGUNTAS BASE · INNERLINK
                </p>

                <h3 className="mt-2 text-2xl font-bold text-white">
                  {baseQuestionModal === "add"
                    ? "Agregar pregunta"
                    : "Editar pregunta"}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {baseQuestionModal === "add"
                    ? "La nueva pregunta se agregará al final de la secuencia oficial."
                    : `${editingBaseQuestion?.question_key ?? "Pregunta"} · Su posición no cambiará.`}
                </p>
              </div>

              <button
                onClick={() => {
                  if (!baseQuestionActionLoading) {
                    setBaseQuestionModal(null);
                    setEditingBaseQuestion(null);
                    setBaseQuestionActionMessage("");
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-lg text-slate-500 transition hover:border-white/20 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <label className="text-[9px] font-bold tracking-[0.14em] text-slate-500">
                TEXTO DE LA PREGUNTA
              </label>

              <textarea
                value={baseQuestionText}
                onChange={(event) =>
                  setBaseQuestionText(event.target.value)
                }
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#020812] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/50"
                placeholder="Escribe la pregunta..."
              />
            </div>

            {baseQuestionModal === "add" && (
              <div className="mt-4">
                <label className="text-[9px] font-bold tracking-[0.14em] text-slate-500">
                  ETAPA
                </label>

                <select
                  value={baseQuestionStage}
                  onChange={(event) =>
                    setBaseQuestionStage(Number(event.target.value))
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#020812] px-4 text-sm text-slate-300 outline-none focus:border-cyan-400/50"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((stage) => (
                    <option key={stage} value={stage}>
                      Etapa {stage}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-[9px] leading-4 text-slate-600">
                  Elegir una etapa no inserta la pregunta entre las anteriores:
                  su posición global seguirá siendo la última pregunta base.
                </p>
              </div>
            )}

            {baseQuestionModal === "edit" &&
              (editingBaseQuestion?.responses_count ?? 0) > 0 && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[10px] leading-5 text-amber-200">
                  Esta pregunta ya tiene{" "}
                  <span className="font-bold">
                    {editingBaseQuestion?.responses_count ?? 0}
                  </span>{" "}
                  respuesta(s). Al guardar te pediremos confirmación.
                </div>
              )}

            <div className="mt-4 grid grid-cols-[120px_1fr] gap-3">
              <div>
                <label className="text-[9px] font-bold tracking-[0.14em] text-slate-500">
                  EMOJI
                </label>

                <input
                  value={baseQuestionEmoji}
                  onChange={(event) =>
                    setBaseQuestionEmoji(event.target.value)
                  }
                  maxLength={8}
                  placeholder="Opcional"
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#020812] px-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold tracking-[0.14em] text-slate-500">
                  DESCRIPCIÓN
                </label>

                <input
                  value={baseQuestionDescription}
                  onChange={(event) =>
                    setBaseQuestionDescription(event.target.value)
                  }
                  placeholder="Opcional"
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#020812] px-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/50"
                />
              </div>
            </div>

            {baseQuestionActionMessage && (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-xs ${
                  baseQuestionActionMessage.startsWith("Error:")
                    ? "border-red-500/20 bg-red-500/5 text-red-300"
                    : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                }`}
              >
                {baseQuestionActionMessage}
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (!baseQuestionActionLoading) {
                    setBaseQuestionModal(null);
                    setEditingBaseQuestion(null);
                    setBaseQuestionActionMessage("");
                  }
                }}
                disabled={baseQuestionActionLoading}
                className="rounded-xl border border-white/10 bg-[#020812] py-3 text-xs font-bold text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                CANCELAR
              </button>

              <button
                onClick={saveBaseQuestion}
                disabled={baseQuestionActionLoading}
                className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 py-3 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-wait disabled:opacity-60"
              >
                {baseQuestionActionLoading
                  ? "GUARDANDO..."
                  : baseQuestionModal === "add"
                  ? "AGREGAR AL FINAL"
                  : "GUARDAR CAMBIOS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* LEGADOS · PREPARADO PARA ETAPA 11 */}
      {/* ===================== */}

      {activeSection === "Legados" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="flex items-start justify-between pr-36">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">Legados</h2>
              <p className="mt-1 text-xs text-slate-500">
                Preparación administrativa del acceso póstumo
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Panel preparado
            </div>
          </div>

          <div className="mt-5">{renderModuleHero("Legados")}</div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-cyan-500/15 bg-[#06111f] px-4 py-4">
              <p className="text-[9px] tracking-wider text-slate-500">LEGADOS ACTIVADOS</p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">
                {dashboardLoading ? "…" : formatNumber(dashboardLegacies)}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#06111f] px-4 py-4">
              <p className="text-[9px] tracking-wider text-slate-500">ETAPA FUNCIONAL</p>
              <p className="mt-1 text-2xl font-bold text-slate-300">11</p>
            </div>
            <div className="rounded-xl border border-purple-500/15 bg-[#06111f] px-4 py-4">
              <p className="text-[9px] tracking-wider text-slate-500">CONTENIDO PRIVADO</p>
              <p className="mt-1 text-2xl font-bold text-purple-300">PROTEGIDO</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-500/15 bg-[#06111f] p-6">
            <p className="text-sm font-bold text-cyan-200">Base administrativa lista</p>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
              Esta sección queda preparada visualmente en Etapa 10. La activación real,
              validación de acceso póstumo y reglas de legado se implementarán en Etapa 11.
              El panel administrativo no expone videos privados del usuario.
            </p>
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* ACTIVIDAD */}
      {/* ===================== */}

      {activeSection === "Actividad" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="flex items-start justify-between pr-36">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">Actividad</h2>
              <p className="mt-1 text-xs text-slate-500">
                Uso real agregado sin exponer respuestas ni videos privados
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Datos en tiempo real
            </div>
          </div>

          <div className="mt-5">{renderModuleHero("Actividad")}</div>

          {activityError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
              No se pudieron cargar las métricas de actividad: {activityError}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {[
              ["RESPUESTAS ACTIVAS", activityLoading ? "…" : formatNumber(activityActiveResponses), "text-purple-300"],
              ["RESPUESTAS HOY", activityLoading ? "…" : formatNumber(activityResponsesToday), "text-cyan-300"],
              ["ÚLTIMOS 7 DÍAS", activityLoading ? "…" : formatNumber(activityResponses7), "text-blue-300"],
              ["ÚLTIMOS 30 DÍAS", activityLoading ? "…" : formatNumber(activityResponses30), "text-cyan-100"],
            ].map(([title, value, color]) => (
              <div key={title} className="rounded-xl border border-cyan-500/15 bg-[#06111f] px-4 py-3">
                <p className="text-[9px] font-semibold tracking-[0.12em] text-slate-500">{title}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-cyan-500/15 bg-[#06111f] p-5">
              <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">USUARIOS CON RESPUESTAS</p>
              <p className="mt-4 text-5xl font-bold text-cyan-100">
                {activityLoading ? "…" : formatNumber(activityUsersWithResponses)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                cuentas con al menos una respuesta activa
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/15 bg-[#06111f] p-5">
              <p className="text-xs font-bold tracking-[0.15em] text-purple-300">USUARIOS ACTIVOS POR PERÍODO</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#020812]/60 px-4 py-4">
                  <p className="text-[9px] text-slate-500">7 DÍAS</p>
                  <p className="mt-1 text-3xl font-bold text-cyan-300">
                    {activityLoading ? "…" : formatNumber(activityUsers7)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#020812]/60 px-4 py-4">
                  <p className="text-[9px] text-slate-500">30 DÍAS</p>
                  <p className="mt-1 text-3xl font-bold text-purple-300">
                    {activityLoading ? "…" : formatNumber(activityUsers30)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/5 bg-[#06111f]/70 px-4 py-3">
            <p className="text-[10px] leading-5 text-slate-600">
              TOTAL HISTÓRICO DE REGISTROS DE RESPUESTA: {activityLoading ? "…" : formatNumber(activityTotalResponses)}.
              Esta vista solo usa conteos agregados; no muestra el contenido de las respuestas ni reproduce videos.
            </p>
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* PAGOS */}
      {/* ===================== */}

      {activeSection === "Pagos" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="pr-36">
            <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">INNERLINK</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Pagos</h2>
            <p className="mt-1 text-xs text-slate-500">
              Preparación del módulo financiero del panel
            </p>
          </div>

          <div className="mt-5">{renderModuleHero("Pagos")}</div>

          <div className="grid grid-cols-4 gap-3">
            {[
              ["TRANSACCIONES", "0", "text-slate-400"],
              ["INGRESOS REALES", "$0", "text-slate-400"],
              ["PROVEEDOR", "NO CONECTADO", "text-amber-300"],
              ["MODO", "PREPARADO", "text-cyan-300"],
            ].map(([title, value, color]) => (
              <div key={title} className="rounded-xl border border-white/5 bg-[#06111f] px-4 py-3">
                <p className="text-[9px] tracking-wider text-slate-500">{title}</p>
                <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-500/15 bg-[#06111f] p-6">
            <p className="text-sm font-bold text-amber-200">Sin integración de cobro todavía</p>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
              No inventamos ingresos ni transacciones. Cuando INNERLINK integre Google Play,
              App Store o un proveedor web, esta sección recibirá ventas, renovaciones,
              reembolsos y estado de suscripciones reales.
            </p>
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* LOGS & SEGURIDAD */}
      {/* ===================== */}

      {activeSection === "Logs & Seguridad" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="pr-36">
            <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">INNERLINK</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Logs & Seguridad</h2>
            <p className="mt-1 text-xs text-slate-500">
              Estado de protecciones administrativas implementadas
            </p>
          </div>

          <div className="mt-5">{renderModuleHero("Logs & Seguridad")}</div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["AUTENTICACIÓN ADMIN", "ACTIVA", "Supabase Auth", "text-emerald-300"],
              ["AUTORIZACIÓN ADMIN", "ACTIVA", "is_current_user_admin()", "text-cyan-300"],
              ["ACCIONES SENSIBLES", "PROTEGIDAS", "RPC security definer", "text-purple-300"],
            ].map(([title, value, detail, color]) => (
              <div key={title} className="rounded-xl border border-cyan-500/15 bg-[#06111f] px-4 py-4">
                <p className="text-[9px] tracking-wider text-slate-500">{title}</p>
                <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
                <p className="mt-2 text-[10px] text-slate-600">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-500/15 bg-[#06111f] p-5">
            <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">CONTROLES YA IMPLEMENTADOS</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="rounded-xl bg-[#020812]/60 px-4 py-3">✓ Login real antes de entrar al panel</div>
              <div className="rounded-xl bg-[#020812]/60 px-4 py-3">✓ Único administrador autorizado</div>
              <div className="rounded-xl bg-[#020812]/60 px-4 py-3">✓ RPC administrativas verifican permisos</div>
              <div className="rounded-xl bg-[#020812]/60 px-4 py-3">✓ Videos privados no se exponen en admin</div>
              <div className="rounded-xl bg-[#020812]/60 px-4 py-3">✓ Premium manual protegido y trazable</div>
              <div className="rounded-xl bg-[#020812]/60 px-4 py-3">✓ Preguntas base se desactivan sin borrado físico</div>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-slate-600">
            Los logs técnicos avanzados, auditoría de accesos y alertas automáticas se pueden ampliar en la etapa de producción.
          </p>
        </section>
      )}

      {/* ===================== */}
      {/* CONFIGURACIÓN */}
      {/* ===================== */}

      {activeSection === "Configuración" && (
        <section className="ml-[250px] min-h-screen px-6 py-4 pb-10">
          <div className="pr-36">
            <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">INNERLINK</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Configuración</h2>
            <p className="mt-1 text-xs text-slate-500">
              Estado operativo y reglas actuales del panel administrativo
            </p>
          </div>

          <div className="mt-5">{renderModuleHero("Configuración")}</div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-cyan-500/15 bg-[#06111f] p-5">
              <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">CONTENIDO</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-[#020812]/60 px-4 py-3">
                  <span className="text-xs text-slate-400">Preguntas base activas</span>
                  <span className="font-bold text-cyan-300">{baseQuestionsLoading ? "…" : activeBaseQuestions}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#020812]/60 px-4 py-3">
                  <span className="text-xs text-slate-400">Máximo dinámico de nivel</span>
                  <span className="font-bold text-purple-300">{levelsRankingsLoading ? "…" : dynamicMaxLevel}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#020812]/60 px-4 py-3">
                  <span className="text-xs text-slate-400">Preguntas inactivas</span>
                  <span className="font-bold text-slate-300">
                    {baseQuestionsLoading ? "…" : Math.max(baseQuestions.length - activeBaseQuestions, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/15 bg-[#06111f] p-5">
              <p className="text-xs font-bold tracking-[0.15em] text-purple-300">REGLAS ACTUALES</p>
              <div className="mt-4 space-y-3 text-xs text-slate-400">
                <div className="rounded-xl bg-[#020812]/60 px-4 py-3">Free: hasta 3 anclajes</div>
                <div className="rounded-xl bg-[#020812]/60 px-4 py-3">Premium: hasta 5 anclajes</div>
                <div className="rounded-xl bg-[#020812]/60 px-4 py-3">Free: video máx. 180 s</div>
                <div className="rounded-xl bg-[#020812]/60 px-4 py-3">Premium: video máx. 300 s</div>
                <div className="rounded-xl bg-[#020812]/60 px-4 py-3">Premium: hasta 5 preguntas personalizadas por etapa</div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/5 bg-[#06111f]/70 px-4 py-3">
            <p className="text-[10px] leading-5 text-slate-600">
              Esta pantalla es informativa por ahora. No permite cambiar límites estructurales accidentalmente desde el navegador.
            </p>
          </div>
        </section>
      )}

      {/* OTRAS SECCIONES */}
      {activeSection !== "Resumen" &&
        activeSection !== "Usuarios" &&
        activeSection !== "Anclajes" &&
        activeSection !== "Legados" &&
        activeSection !== "Premium" &&
        activeSection !== "Niveles" &&
        activeSection !== "Rankings" &&
        activeSection !== "Preguntas Personalizadas" &&
        activeSection !== "Actividad" &&
        activeSection !== "Pagos" &&
        activeSection !== "Logs & Seguridad" &&
        activeSection !== "Configuración" && (
          <section className="ml-[250px] h-screen overflow-hidden px-6 py-4">
            <div className="pr-36">
              <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                INNERLINK
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                {activeSection}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Panel administrativo · {activeSection}
              </p>
            </div>

            <div className="mt-5">
              {renderModuleHero(activeSection)}
            </div>

            <div className="rounded-2xl border border-cyan-500/15 bg-[#06111f] px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-300">
                Construcción funcional de {activeSection} pendiente
              </p>

              <p className="mt-2 text-xs text-slate-600">
                La cabecera ya quedó preparada para recibir su métrica principal real.
              </p>
            </div>
          </section>
        )}

    </main>
  );
}
