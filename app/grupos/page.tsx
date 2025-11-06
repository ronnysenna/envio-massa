"use client";

import { Edit2, Plus, Search, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import GroupModal from "@/components/GroupModal";
import ManageContactsModal from "@/components/ManageContactsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";

interface Group {
  id: number;
  nome: string;
  descricao?: string | null;
  _count?: {
    contacts: number;
  };
  contacts?: {
    contact: {
      id: number;
      nome: string;
      telefone: string;
      email?: string;
    };
  }[];
}

export default function GruposPage() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados para modal de grupo
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Estados para modal de contatos
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);

  const fetchGroups = useCallback(
    async (query = "") => {
      try {
        setLoading(true);
        const q = new URLSearchParams({ search: query || "" });
        const res = await fetch(`/api/groups?${q.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) {
          showToast({ type: "error", message: "Falha ao buscar grupos." });
          return;
        }
        const data = await res.json();
        setGroups(data.groups || []);
      } catch (err) {
        console.error("fetchGroups error", err);
        showToast({ type: "error", message: "Erro ao carregar grupos." });
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    const id = window.setTimeout(() => fetchGroups(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search, fetchGroups]);

  // Funções do modal de grupo
  const handleCreateClick = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleEditClick = (group: Group) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    setEditingGroup(null);
  };

  const handleSaveGroup = async (groupData: {
    id?: number;
    nome: string;
    descricao?: string | null;
  }) => {
    try {
      const isEditing = !!groupData.id;
      const url = isEditing ? `/api/groups/${groupData.id}` : "/api/groups";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(groupData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          type: "error",
          message:
            data.error || `Falha ao ${isEditing ? "editar" : "criar"} grupo.`,
        });
        return;
      }

      showToast({
        type: "success",
        message: `Grupo ${isEditing ? "editado" : "criado"} com sucesso.`,
      });
      fetchGroups();
    } catch (err) {
      console.error("Erro ao salvar grupo:", err);
      showToast({ type: "error", message: "Erro ao salvar grupo." });
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar o grupo "${group.nome}"?`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          type: "error",
          message: data.error || "Falha ao deletar grupo.",
        });
        return;
      }

      showToast({ type: "success", message: "Grupo deletado com sucesso." });
      fetchGroups();
    } catch (err) {
      console.error("Erro ao deletar grupo:", err);
      showToast({ type: "error", message: "Erro ao deletar grupo." });
    }
  };

  // Funções do modal de contatos
  const handleManageContactsClick = async (group: Group) => {
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        showToast({
          type: "error",
          message: "Falha ao carregar detalhes do grupo.",
        });
        return;
      }
      const data = await res.json();
      setManagingGroup(data.group);
      setIsContactsModalOpen(true);
    } catch (err) {
      console.error("Erro ao carregar grupo:", err);
      showToast({
        type: "error",
        message: "Erro ao carregar detalhes do grupo.",
      });
    }
  };

  const handleCloseContactsModal = () => {
    setIsContactsModalOpen(false);
    setManagingGroup(null);
  };

  const handleSaveContacts = async (groupId: number, contactIds: number[]) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contactIds }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          type: "error",
          message: data.error || "Falha ao salvar contatos do grupo.",
        });
        return;
      }

      showToast({
        type: "success",
        message: "Contatos do grupo atualizados com sucesso.",
      });
      fetchGroups();
    } catch (err) {
      console.error("Erro ao salvar contatos:", err);
      showToast({
        type: "error",
        message: "Erro ao salvar contatos do grupo.",
      });
    }
  };

  return (
    <ProtectedRoute>
      <main className="flex-1 p-6 bg-transparent min-h-screen">
        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Grupos de Contatos
            </h1>
            <button
              type="button"
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Novo Grupo
            </button>
          </div>

          {/* Busca */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border mb-6">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="search"
                placeholder="Buscar grupos por nome ou descrição"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lista de grupos */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                Carregando grupos...
              </div>
            ) : groups.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {search
                  ? "Nenhum grupo encontrado com essa busca."
                  : "Nenhum grupo criado ainda."}
                {!search && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleCreateClick}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Criar seu primeiro grupo
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {groups.map((group) => (
                  <div key={group.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {group.nome}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            <Users size={12} />
                            {group._count?.contacts || 0}
                          </span>
                        </div>
                        {group.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {group.descricao}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => handleManageContactsClick(group)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                          title="Gerenciar contatos"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(group)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Editar grupo"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Deletar grupo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modais */}
      <GroupModal
        group={editingGroup}
        isOpen={isGroupModalOpen}
        onClose={handleCloseGroupModal}
        onSave={handleSaveGroup}
      />

      <ManageContactsModal
        group={managingGroup}
        isOpen={isContactsModalOpen}
        onClose={handleCloseContactsModal}
        onSave={handleSaveContacts}
      />
    </ProtectedRoute>
  );
}
