"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface GroupData {
  id?: number;
  nome: string;
  descricao?: string | null;
}

interface GroupModalProps {
  group: GroupData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: GroupData) => Promise<void>;
}

export default function GroupModal({
  group,
  isOpen,
  onClose,
  onSave,
}: GroupModalProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNome(newName);
    setIsValid(newName.trim().length > 0);
  };

  useEffect(() => {
    if (group) {
      setNome(group.nome || "");
      setDescricao(group.descricao || "");
      setIsValid((group.nome || "").trim().length > 0);
    } else {
      setNome("");
      setDescricao("");
      setIsValid(false);
    }
  }, [group]);

  const handleSave = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      const groupData: GroupData = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
      };

      if (group?.id) {
        groupData.id = group.id;
      }

      await onSave(groupData);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar grupo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {group?.id ? "Editar Grupo" : "Criar Grupo"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="group-nome"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome *
            </label>
            <input
              id="group-nome"
              type="text"
              value={nome}
              onChange={handleNameChange}
              placeholder="Nome do grupo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="group-descricao"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Descrição
            </label>
            <textarea
              id="group-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do grupo (opcional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
