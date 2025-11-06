"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Contact } from "@/lib/webhook";

interface EditContactModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => Promise<void>;
}

// normaliza removendo tudo que não for dígito
const normalizePhone = (v: string) => v.replace(/\D/g, "");

// formata número no padrão brasileiro enquanto o usuário digita
const formatBRPhone = (digits: string) => {
  if (!digits) return "";
  const d = digits;
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  // 11+ digits (DDD + 9 digitos)
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
};

export default function EditContactModal({
  contact,
  isOpen,
  onClose,
  onSave,
}: EditContactModalProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = normalizePhone(raw);
    setTelefone(formatBRPhone(digits));
    // válido se tiver 10 ou 11 dígitos (BR landline/mobile)
    const phoneValid = digits.length === 10 || digits.length === 11;
    setIsValid(phoneValid && nome.trim().length > 0);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNome(newName);
    const digits = normalizePhone(telefone);
    const phoneValid = digits.length === 10 || digits.length === 11;
    setIsValid(phoneValid && newName.trim().length > 0);
  };

  useEffect(() => {
    if (contact) {
      setNome(contact.nome || "");
      setTelefone(formatBRPhone(contact.telefone || ""));
      setEmail(contact.email || "");

      const digits = normalizePhone(contact.telefone || "");
      const phoneValid = digits.length === 10 || digits.length === 11;
      setIsValid(phoneValid && (contact.nome || "").trim().length > 0);
    } else {
      setNome("");
      setTelefone("");
      setEmail("");
      setIsValid(false);
    }
  }, [contact]);

  const handleSave = async () => {
    if (!contact || !isValid) return;

    setLoading(true);
    try {
      const updatedContact: Contact = {
        ...contact,
        nome: nome.trim(),
        telefone: normalizePhone(telefone),
        email: email.trim() || undefined,
      };

      await onSave(updatedContact);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
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
            Editar Contato
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
              htmlFor="edit-nome"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome *
            </label>
            <input
              id="edit-nome"
              type="text"
              value={nome}
              onChange={handleNameChange}
              placeholder="Nome do contato"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="edit-telefone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Telefone *
            </label>
            <input
              id="edit-telefone"
              type="text"
              value={telefone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: (DD) 9XXXX-XXXX — válido com 10 ou 11 dígitos
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
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
