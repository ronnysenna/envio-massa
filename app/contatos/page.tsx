"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Upload } from "lucide-react";
import type { Contact } from "@/lib/webhook";
import { importFromCSV, importFromExcel } from "@/lib/fileUtils";
import { useToast } from "@/components/ToastProvider";

export default function ContatosPage() {
    const { showToast } = useToast();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

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
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={3} className="p-4 text-sm text-gray-600">Carregando...</td></tr>
                                ) : contacts.length === 0 ? (
                                    <tr><td colSpan={3} className="p-4 text-sm text-gray-600">Nenhum contato encontrado.</td></tr>
                                ) : (
                                    contacts.map((c, i) => (
                                        <tr key={`${c.id ?? c.telefone ?? i}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">{c.nome}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{c.telefone}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{c.email}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
