"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Contact } from "@/lib/webhook";
import {
  exportToCSV,
  exportToExcel,
  importFromCSV,
  importFromExcel,
} from "@/lib/fileUtils";

export default function ContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  useEffect(() => {
    let mounted = true;
    async function fetchPage() {
      try {
        setLoading(true);
        const q = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          search: search || "",
        });
        const res = await fetch(`/api/contacts?${q.toString()}`);
        if (!mounted) return;
        if (!res.ok) {
          setStatus({ type: "error", message: "Falha ao buscar contatos." });
          return;
        }
        const data = await res.json();
        setContacts(data.contacts || []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      } catch (_err) {
        setStatus({ type: "error", message: "Erro ao carregar contatos." });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchPage();
    return () => {
      mounted = false;
    };
  }, [page, limit, search]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let importedContacts: Contact[] = [];

      if (file.name.endsWith(".csv")) {
        importedContacts = await importFromCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        importedContacts = await importFromExcel(file);
      } else {
        setStatus({
          type: "error",
          message: "Formato de arquivo não suportado. Use CSV ou XLSX.",
        });
        return;
      }

      setContacts(importedContacts);
      setStatus({
        type: "success",
        message: `${importedContacts.length} contatos importados com sucesso!`,
      });
    } catch (_error) {
      setStatus({
        type: "error",
        message: "Erro ao importar contatos. Verifique o formato do arquivo.",
      });
    }
  };

  const handleExportCSV = () => {
    if (contacts.length === 0) {
      // Exportar template vazio
      const template: Contact[] = [
        {
          nome: "João Silva",
          telefone: "11999999999",
          email: "joao@exemplo.com",
        },
        {
          nome: "Maria Santos",
          telefone: "11988888888",
          email: "maria@exemplo.com",
        },
      ];
      exportToCSV(template, "template_contatos.csv");
      setStatus({
        type: "success",
        message: "Template CSV baixado com sucesso!",
      });
    } else {
      exportToCSV(contacts);
      setStatus({
        type: "success",
        message: "Contatos exportados em CSV com sucesso!",
      });
    }
  };

  const handleExportExcel = () => {
    if (contacts.length === 0) {
      // Exportar template vazio
      const template: Contact[] = [
        {
          nome: "João Silva",
          telefone: "11999999999",
          email: "joao@exemplo.com",
        },
        {
          nome: "Maria Santos",
          telefone: "11988888888",
          email: "maria@exemplo.com",
        },
      ];
      exportToExcel(template, "template_contatos.xlsx");
      setStatus({
        type: "success",
        message: "Template Excel baixado com sucesso!",
      });
    } else {
      exportToExcel(contacts);
      setStatus({
        type: "success",
        message: "Contatos exportados em Excel com sucesso!",
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Gerenciar Contatos
          </h1>

          {/* Import Section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload size={24} />
              Importar Contatos
            </h2>
            <p className="text-gray-600 mb-4">
              Importe seus contatos de um arquivo CSV ou Excel. O arquivo deve
              conter as colunas: nome, telefone, email.
            </p>
            <label htmlFor="contacts-file" className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition text-center">
                <Upload className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-gray-700 font-semibold mb-1">
                  Clique para selecionar arquivo
                </p>
                <p className="text-sm text-gray-500">CSV ou XLSX</p>
              </div>
              <input
                id="contacts-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Search / Pagination Controls */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                placeholder="Buscar por nome ou telefone"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="flex-1 px-3 py-2 border rounded"
              />
              <select
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
                className="px-3 py-2 border rounded"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                {loading
                  ? "Carregando..."
                  : `Mostrando ${contacts.length} de ${total}`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2">Página {page}</span>
                <button
                  type="button"
                  disabled={page * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Download size={24} />
              Exportar Contatos
            </h2>
            <p className="text-gray-600 mb-4">
              {contacts.length > 0
                ? `Exporte ${contacts.length} contatos carregados ou baixe um template vazio.`
                : "Baixe um template para preencher com seus contatos."}
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Exportar Excel
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {status.type && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                status.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle className="text-green-600 shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-red-600 shrink-0" size={20} />
              )}
              <p
                className={`text-sm ${
                  status.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {status.message}
              </p>
            </div>
          )}

          {/* Contacts Table */}
          {contacts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={24} />
                  Contatos Carregados ({total})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Telefone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contacts.map((contact, _index) => (
                      <tr
                        key={contact.nome + contact.telefone}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {contact.telefone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200">
                  Página {page} — mostrando {contacts.length} de {total}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
