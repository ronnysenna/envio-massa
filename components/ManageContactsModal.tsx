"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

interface Contact {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
}

interface Group {
  id: number;
  nome: string;
  contacts?: { contact: Contact }[];
}

interface ManageContactsModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (groupId: number, contactIds: number[]) => Promise<void>;
}

export default function ManageContactsModal({
  group,
  isOpen,
  onClose,
  onSave,
}: ManageContactsModalProps) {
  const toast = useToast();
  const MAX_SELECT = 25;

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Buscar todos os contatos (até limite razoável da API)
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/contacts?limit=1000&page=1", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setAllContacts(data.contacts || []);
        })
        .catch((err) => {
          console.error("Erro ao buscar contatos:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  // Configurar contatos selecionados quando o grupo mudar
  useEffect(() => {
    if (group?.contacts) {
      const groupContactIds = group.contacts.map((gc) => gc.contact.id);
      if (groupContactIds.length > MAX_SELECT) {
        setSelectedContactIds(groupContactIds.slice(0, MAX_SELECT));
        toast.showToast({
          type: "info",
          message: `O grupo possui mais de ${MAX_SELECT} contatos — apenas os primeiros ${MAX_SELECT} foram carregados para edição.`,
        });
      } else {
        setSelectedContactIds(groupContactIds);
      }
    } else {
      setSelectedContactIds([]);
    }
  }, [group, toast]);

  const filteredContacts = allContacts.filter(
    (contact) =>
      contact.nome.toLowerCase().includes(search.toLowerCase()) ||
      contact.telefone.includes(search),
  );

  const handleToggleContact = (contactId: number) => {
    setSelectedContactIds((prev) => {
      if (prev.includes(contactId)) {
        return prev.filter((id) => id !== contactId);
      }
      if (prev.length >= MAX_SELECT) {
        toast.showToast({
          type: "error",
          message: `Você só pode selecionar até ${MAX_SELECT} contatos.`,
        });
        return prev;
      }
      return [...prev, contactId];
    });
  };

  const handleSelectAll = () => {
    const ids = filteredContacts.map((c) => c.id);
    if (ids.length > MAX_SELECT) {
      setSelectedContactIds(ids.slice(0, MAX_SELECT));
      toast.showToast({
        type: "info",
        message: `Foram selecionados os primeiros ${MAX_SELECT} contatos (limite).`,
      });
    } else {
      setSelectedContactIds(ids);
    }
  };

  const handleSelectNone = () => {
    setSelectedContactIds([]);
  };

  const handleSave = async () => {
    if (!group?.id) return;

    setSaving(true);
    try {
      await onSave(group.id, selectedContactIds);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar contatos do grupo:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Gerenciar Contatos
            </h2>
            <p className="text-sm text-gray-600">Grupo: {group.nome}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {/* Busca */}
          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar contatos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botões de seleção */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Selecionar Todos
            </button>
            <button
              type="button"
              onClick={handleSelectNone}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Desselecionar Todos
            </button>
            <span className="text-xs text-gray-500 self-center">
              {selectedContactIds.length} selecionados
            </span>
          </div>

          {/* Lista de contatos */}
          <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Carregando contatos...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {search
                  ? "Nenhum contato encontrado com essa busca"
                  : "Nenhum contato disponível"}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(contact.id)}
                      onChange={() => handleToggleContact(contact.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {contact.nome}
                      </div>
                      <div className="text-xs text-gray-500">
                        {contact.telefone}
                        {contact.email && ` • ${contact.email}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
