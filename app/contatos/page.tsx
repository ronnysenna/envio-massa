"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import EditContactModal from "@/components/EditContactModal";
import { Upload, Edit2, Trash2 } from "lucide-react";
import type { Contact } from "@/lib/webhook";
import { importFromCSV, importFromExcel } from "@/lib/fileUtils";
import { useToast } from "@/components/ToastProvider";

export default function ContatosPage() {
    const { showToast } = useToast();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    // estados para adicionar contato manualmente
    const [manualName, setManualName] = useState("");
    const [manualPhone, setManualPhone] = useState("");
    const [manualPhoneValid, setManualPhoneValid] = useState<boolean>(false);
    // Estados para modal de edição
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // normaliza removendo tudo que não for dígito
    const normalizePhone = (v: string) => v.replace(/\D/g, "");

    // formata número no padrão brasileiro enquanto o usuário digita
    const formatBRPhone = (digits: string) => {
        if (!digits) return "";
        const d = digits;
        if (d.length <= 2) return `(${d}`;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        // 11+ digits (DDD + 9 digitos)
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    };

    const handleManualPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const digits = normalizePhone(raw);
        setManualPhone(formatBRPhone(digits));
        // válido se tiver 10 ou 11 dígitos (BR landline/mobile)
        setManualPhoneValid(digits.length === 10 || digits.length === 11);
    };

    const fetchContacts = useCallback(async (query = "") => {
        try {
            setLoading(true);
            const q = new URLSearchParams({ search: query || "" });
            const res = await fetch(`/api/contacts?${q.toString()}`, { credentials: 'include' });
            if (!res.ok) {
                showToast({ type: 'error', message: 'Falha ao buscar contatos.' });
                return;
            }
            const data = await res.json();
            setContacts(data.contacts || []);
        } catch (err) {
            console.error('fetchContacts error', err);
            showToast({ type: 'error', message: 'Erro ao carregar contatos.' });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    useEffect(() => {
        const id = window.setTimeout(() => fetchContacts(search.trim()), 300);
        return () => window.clearTimeout(id);
    }, [search, fetchContacts]);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            let importedContacts: Contact[] = [];
            const name = file.name.toLowerCase();

            if (name.endsWith('.csv')) {
                importedContacts = await importFromCSV(file);
            } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
                importedContacts = await importFromExcel(file);
            } else {
                showToast({ type: 'error', message: 'Formato não suportado. Use CSV ou XLSX.' });
                return;
            }

            if (importedContacts.length === 0) {
                showToast({ type: 'error', message: 'Nenhum contato encontrado no arquivo.' });
                return;
            }

            const res = await fetch('/api/contacts/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ contacts: importedContacts }),
            });

            const result = await res.json().catch(() => ({}));
            if (!res.ok) {
                console.error('Import bulk failed', res.status, result);
                showToast({ type: 'error', message: result.error || 'Falha ao persistir contatos.' });
                return;
            }

            await fetchContacts();
            showToast({ type: 'success', message: `${result.inserted ?? 0} inseridos, ${result.updated ?? 0} atualizados${result.failed ? `, ${result.failed} falharam` : ''}.` });
        } catch (err) {
            console.error('handleImport error', err);
            showToast({ type: 'error', message: 'Erro ao importar contatos. Verifique o arquivo.' });
        }
    };

    const handleAddManual = async () => {
        const nome = manualName.trim();
        const telefone = normalizePhone(manualPhone.trim());
        if (!telefone) {
            showToast({ type: 'error', message: 'Telefone é obrigatório.' });
            return;
        }
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nome, telefone }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showToast({ type: 'error', message: data.error || 'Falha ao adicionar contato.' });
                return;
            }
            showToast({ type: 'success', message: 'Contato adicionado.' });
            setManualName('');
            setManualPhone('');
            fetchContacts();
        } catch (err) {
            console.error('add manual contact', err);
            showToast({ type: 'error', message: 'Erro ao adicionar contato.' });
        }
    };

    const handleClearManual = () => {
        setManualName('');
        setManualPhone('');
    };

    // Função para abrir modal de edição
    const handleEditClick = (contact: Contact) => {
        setEditingContact(contact);
        setIsEditModalOpen(true);
    };

    // Função para fechar modal de edição
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingContact(null);
    };

    // Função para salvar contato editado
    const handleSaveContact = async (updatedContact: Contact) => {
        try {
            const res = await fetch(`/api/contacts/${updatedContact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    nome: updatedContact.nome,
                    telefone: updatedContact.telefone,
                    email: updatedContact.email,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showToast({ type: 'error', message: data.error || 'Falha ao editar contato.' });
                return;
            }

            showToast({ type: 'success', message: 'Contato editado com sucesso.' });
            fetchContacts();
        } catch (err) {
            console.error('Erro ao editar contato:', err);
            showToast({ type: 'error', message: 'Erro ao editar contato.' });
        }
    };

    // Função para deletar contato
    const handleDeleteContact = async (contact: Contact) => {
        const confirmed = window.confirm(`Tem certeza que deseja deletar o contato "${contact.nome}"?`);
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/contacts/${contact.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showToast({ type: 'error', message: data.error || 'Falha ao deletar contato.' });
                return;
            }

            showToast({ type: 'success', message: 'Contato deletado com sucesso.' });
            fetchContacts();
        } catch (err) {
            console.error('Erro ao deletar contato:', err);
            showToast({ type: 'error', message: 'Erro ao deletar contato.' });
        }
    };

    return (
        <ProtectedRoute>
            <main className="flex-1 p-6 bg-transparent min-h-screen">
                <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Contatos</h1>

                    {/* Import */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Upload size={20} />
                            <div className="text-sm font-medium text-gray-800">Importar Contatos (CSV / XLSX)</div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">O arquivo deve conter colunas como nome, telefone e email.</p>

                        <label htmlFor="contacts-file" className="cursor-pointer inline-block">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition text-center w-full">
                                <div className="text-sm text-gray-700 font-semibold">Clique para selecionar arquivo</div>
                                <div className="text-xs text-gray-500">CSV ou XLSX</div>
                            </div>
                        </label>
                        <input id="contacts-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
                    </div>

                    {/* Add manual contact */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border mb-6">
                        <div className="text-sm font-medium text-gray-800 mb-2">Adicionar contato manualmente</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                                id="manual-name"
                                placeholder="Nome"
                                value={manualName}
                                onChange={(e) => setManualName(e.target.value)}
                                className="col-span-2 px-3 py-2 border rounded"
                            />
                            <input
                                id="manual-phone"
                                placeholder="Telefone"
                                value={manualPhone}
                                onChange={handleManualPhoneChange}
                                className="px-3 py-2 border rounded"
                            />
                        </div>
                        <div className="mt-1">
                            <div className="text-xs text-gray-500">Formato: (DD) 9XXXX-XXXX — válido com 10 ou 11 dígitos</div>
                            {!manualPhoneValid && manualPhone.length > 0 && (
                                <div className="text-xs text-red-600 mt-1">Telefone inválido. Informe DDD + número (10 ou 11 dígitos).</div>
                            )}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                            <button
                                id="manual-add"
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                                type="button"
                                onClick={handleAddManual}
                                disabled={!manualPhoneValid}
                                aria-disabled={!manualPhoneValid}
                            >
                                Adicionar
                            </button>
                            <button
                                id="manual-clear"
                                className="px-4 py-2 border rounded"
                                type="button"
                                onClick={handleClearManual}
                            >
                                Limpar
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border mb-6">
                        <input
                            type="search"
                            placeholder="Buscar por nome ou telefone"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-auto">
                        <table className="min-w-full table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Nome</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Telefone</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="p-4 text-sm text-gray-600">Carregando...</td></tr>
                                ) : contacts.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-sm text-gray-600">Nenhum contato encontrado.</td></tr>
                                ) : (
                                    contacts.map((c, i) => (
                                        <tr key={`${c.id ?? c.telefone ?? i}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">{c.nome}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{c.telefone}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{c.email}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditClick(c)}
                                                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar contato"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteContact(c)}
                                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                        title="Deletar contato"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal de Edição */}
            <EditContactModal
                contact={editingContact}
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSave={handleSaveContact}
            />
        </ProtectedRoute>
    );
}
