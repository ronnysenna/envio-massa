"use client";

import { AlertCircle, CheckCircle, Loader2, Send, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
// Sidebar moved to global layout
import { useToast } from "@/components/ToastProvider";
import { importFromCSV, importFromExcel } from "@/lib/fileUtils";
import type { Contact } from "@/lib/webhook";
import { sendMessage } from "@/lib/webhook";

export default function EnviarPage() {
    const toast = useToast();
    const [message, setMessage] = useState("");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [_imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    // remover status persistente — usamos toasts para feedback rápido
    // modo de envio: 'server' (backend/n8n busca contatos) ou 'client' (envia contatos selecionados)
    const [sendMode, setSendMode] = useState<"server" | "client">("server");

    useEffect(() => {
        let mounted = true;
        async function fetchContacts() {
            try {
                const res = await fetch("/api/contacts");
                if (!mounted) return;
                if (res.ok) {
                    const data = await res.json();
                    setContacts(data.contacts || []);
                }
            } catch (_err) {
                // ignore
            }
        }
        fetchContacts();
        return () => {
            mounted = false;
        };
    }, []);

    // persistir seleção localmente para melhorar UX entre navegações
    useEffect(() => {
        try {
            const raw = localStorage.getItem("selectedIds");
            if (raw) {
                const parsed = JSON.parse(raw) as number[];
                if (Array.isArray(parsed)) setSelectedIds(parsed);
            }
        } catch { }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("selectedIds", JSON.stringify(selectedIds));
        } catch { }
    }, [selectedIds]);

    // Renderer para react-window (definido fora do JSX)
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const c = contacts[index];
        if (!c) return null;
        return (
            <div style={style} key={c.id || c.telefone} className="flex items-center px-2 py-1 border-b">
                <div className="flex-1 text-sm text-gray-900">{c.nome}</div>
                <div className="w-40 text-sm text-gray-600">{c.telefone}</div>
                <div className="w-24">
                    <input
                        type="checkbox"
                        checked={!!(c.id && selectedIds.includes(c.id))}
                        onChange={(e) => {
                            if (!c.id) return;
                            if (e.target.checked) {
                                setSelectedIds((prev) => {
                                    const id = c.id as number;
                                    if (!id) return prev;
                                    return prev.includes(id) ? prev : [...prev, id];
                                });
                            } else {
                                setSelectedIds((prev) => prev.filter((id) => id !== c.id));
                            }
                        }}
                    />
                </div>
            </div>
        );
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            let importedContacts: Contact[] = [];
            if (file.name.toLowerCase().endsWith(".csv")) {
                importedContacts = await importFromCSV(file);
            } else if (
                file.name.toLowerCase().endsWith(".xlsx") ||
                file.name.toLowerCase().endsWith(".xls")
            ) {
                importedContacts = await importFromExcel(file);
            }

            if (importedContacts.length === 0) {
                toast.showToast({
                    type: "error",
                    message: "Nenhum contato encontrado no arquivo.",
                });
                return;
            }

            const response = await fetch("/api/contacts/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contacts: importedContacts }),
            });

            const data = await response.json();
            if (!response.ok) {
                toast.showToast({
                    type: "error",
                    message: data.message || "Erro ao enviar para o servidor.",
                });
                return;
            }

            // ao persistir, buscar contatos do DB para obter ids e estado consistente
            const listRes = await fetch("/api/contacts");
            if (!listRes.ok) {
                toast.showToast({
                    type: "error",
                    message: "Importado, mas falha ao buscar contatos do servidor.",
                });
                return;
            }
            const listData = await listRes.json();
            const serverContacts: Contact[] = listData.contacts || [];
            setContacts(serverContacts);
            // selecionar todos por id por padrão após import
            setSelectedIds(serverContacts.map((c) => c.id || 0).filter(Boolean));
            toast.showToast({
                type: "success",
                message: `${data.inserted} inseridos, ${data.updated} atualizados.`,
            });
        } catch {
            toast.showToast({
                type: "error",
                message: "Erro ao importar contatos. Tente novamente.",
            });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.showToast({
                type: "error",
                message: "Por favor, selecione um arquivo de imagem válido.",
            });
            return;
        }

        // preview local
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        // upload para API que salva em /public/uploads ou S3
        try {
            setImageUploading(true);
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/images/upload", {
                method: "POST",
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) {
                toast.showToast({
                    type: "error",
                    message: data.error || "Erro ao enviar imagem",
                });
                setImageUrl(null);
            } else {
                setImageUrl(data.url);
                toast.showToast({
                    type: "success",
                    message: "Imagem enviada com sucesso.",
                });
            }
        } catch (_err) {
            toast.showToast({ type: "error", message: "Erro ao enviar imagem." });
        } finally {
            setImageUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // não usamos status persistente aqui, apenas toasts

        if (!message.trim()) {
            toast.showToast({ type: "error", message: "Por favor, digite uma mensagem." });
            return;
        }

        if (!contacts || contacts.length === 0) {
            toast.showToast({ type: "error", message: "Nenhum contato disponível. Importe contatos antes de enviar." });
            return;
        }

        // se usuário escolheu enviar contatos pelo cliente, garantir seleção
        const selectedContacts = contacts.filter((c) => c.id && selectedIds.includes(c.id));
        if (sendMode === "client" && selectedContacts.length === 0) {
            toast.showToast({ type: "error", message: "Selecione ao menos um contato para enviar quando usar 'Enviar contatos selecionados'." });
            return;
        }

        setLoading(true);

        try {
            const options = sendMode === "client" ? { includeContacts: true, contacts: selectedContacts } : undefined;

            const result = await sendMessage({ message, imageUrl: imageUrl || undefined }, options as any);

            if (result.success) {
                const sentCount = sendMode === "client" ? selectedContacts.length : contacts.length;
                toast.showToast({ type: "success", message: `Mensagem enviada com sucesso${sentCount ? ` para ${sentCount} contatos` : ""}!` });
                setMessage("");
                // manter contatos carregados; limpar imagem
                setImageFile(null);
                setImagePreview(null);
                setImageUrl(null);
            } else {
                toast.showToast({ type: "error", message: result.error || "Erro ao enviar mensagem." });
            }
        } catch (_err) {
            toast.showToast({ type: "error", message: "Erro ao enviar mensagem. Tente novamente." });
        } finally {
            setLoading(false);
        }
    };

    // Virtualização simples sem dependência externa (evita problemas de tipagem)
    const itemHeight = 36; // px
    const virtualContainerRef = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(320);

    useEffect(() => {
        const el = virtualContainerRef.current;
        if (!el) return;
        // inicializa altura do container
        setContainerHeight(el.clientHeight || 320);

        const onResize = () => setContainerHeight(el.clientHeight || 320);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop((e.target as HTMLDivElement).scrollTop);
    }, []);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3);
    const endIndex = Math.min(contacts.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + 3);
    const visible = contacts.slice(startIndex, endIndex);

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 bg-transparent min-h-screen">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Enviar Mensagem</h1>

                    <form onSubmit={handleSubmit} className="max-w-3xl">
                        {/* Mensagem */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                            <label
                                htmlFor="message"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Mensagem
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                placeholder="Digite sua mensagem aqui..."
                                required
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                {message.length} caracteres
                            </p>
                        </div>

                        {/* Upload de Contatos */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                            <label
                                htmlFor="file-upload"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Importar Contatos (CSV ou XLSX)
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 cursor-pointer">
                                    <div className={`border-2 border-dashed rounded-lg p-6 transition text-center ${contacts.length > 0 ? "border-green-500 bg-white" : "border-gray-300 hover:border-blue-500 bg-white"}`}>
                                        <Upload
                                            className={`mx-auto mb-2 ${contacts.length > 0 ? "text-green-600" : "text-gray-400"}`}
                                            size={32}
                                        />
                                        <p className="text-sm text-gray-700">
                                            {contacts.length > 0
                                                ? "Arquivo importado com sucesso"
                                                : "Clique para selecionar arquivo"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">CSV ou XLSX</p>
                                        {contacts.length > 0 && (
                                            <div className="mt-2 text-sm text-green-700 font-medium">
                                                {contacts.length} contatos carregados
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {contacts.length > 0 && (
                                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg import-preview">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-gray-800">
                                            Pré-visualização dos contatos importados:
                                        </div>
                                        <div className="text-sm text-green-600 font-medium">
                                            {contacts.length} contatos
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-blue-600"
                                            checked={
                                                contacts.length > 0 &&
                                                selectedIds.length === contacts.length
                                            }
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(
                                                        contacts.map((c) => c.id || 0).filter(Boolean),
                                                    );
                                                } else {
                                                    setSelectedIds([]);
                                                }
                                            }}
                                        />
                                        <span className="text-sm font-semibold text-gray-800">
                                            Selecionar todos
                                        </span>
                                    </div>

                                    <div className="max-h-40">
                                        {contacts.length > 200 ? (
                                            <div ref={virtualContainerRef} style={{ height: 320, overflow: "auto" }} onScroll={onScroll}>
                                                <div style={{ height: contacts.length * itemHeight, position: "relative" }}>
                                                    <div style={{ position: "absolute", top: startIndex * itemHeight, left: 0, right: 0 }}>
                                                        {visible.map((_, idx) => (
                                                            <div
                                                                key={contacts[startIndex + idx]?.id ?? contacts[startIndex + idx]?.telefone}
                                                                style={{ height: itemHeight } as React.CSSProperties}
                                                                className="flex items-center px-2 py-1 border-b clickable-row"
                                                                onClick={(e) => {
                                                                    // evitar duplicar quando clicam no checkbox
                                                                    if ((e.target as HTMLElement).tagName === "INPUT") return;
                                                                    const c = contacts[startIndex + idx];
                                                                    if (!c?.id) return;
                                                                    setSelectedIds((prev) =>
                                                                        prev.includes(c.id as number)
                                                                            ? prev.filter((id) => id !== c.id)
                                                                            : [...prev, c.id as number],
                                                                    );
                                                                }}
                                                            >
                                                                <div className="flex-1 text-sm text-gray-900">{contacts[startIndex + idx]?.nome}</div>
                                                                <div className="w-40 text-sm text-gray-700">{contacts[startIndex + idx]?.telefone}</div>
                                                                <div className="w-24">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 accent-blue-600"
                                                                        checked={!!(contacts[startIndex + idx]?.id && selectedIds.includes(contacts[startIndex + idx]?.id as number))}
                                                                        onChange={(e) => {
                                                                            const c = contacts[startIndex + idx];
                                                                            if (!c?.id) return;
                                                                            if (e.target.checked) {
                                                                                setSelectedIds((prev) => (prev.includes(c.id as number) ? prev : [...prev, c.id as number]));
                                                                            } else {
                                                                                setSelectedIds((prev) => prev.filter((id) => id !== c.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="overflow-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-left text-xs text-gray-600">
                                                            <th className="px-2 py-1">Nome</th>
                                                            <th className="px-2 py-1">Telefone</th>
                                                            <th className="px-2 py-1">Selecionar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {contacts.slice(0, 200).map((c) => (
                                                            <tr key={c.id || c.telefone} className="hover:bg-gray-50 clickable-row" onClick={(e) => {
                                                                if ((e.target as HTMLElement).tagName === "INPUT") return;
                                                                if (!c.id) return;
                                                                setSelectedIds((prev) => (prev.includes(c.id as number) ? prev.filter((id) => id !== c.id) : [...prev, c.id as number]));
                                                            }}>
                                                                <td className="px-2 py-1 text-sm text-gray-900">{c.nome}</td>
                                                                <td className="px-2 py-1 text-sm text-gray-700">{c.telefone}</td>
                                                                <td className="px-2 py-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 accent-blue-600"
                                                                        checked={!!(c.id && selectedIds.includes(c.id))}
                                                                        onChange={(e) => {
                                                                            if (!c.id) return;
                                                                            if (e.target.checked) {
                                                                                setSelectedIds((prev) => {
                                                                                    const id = c.id as number;
                                                                                    if (!id) return prev;
                                                                                    return prev.includes(id) ? prev : [...prev, id];
                                                                                });
                                                                            } else {
                                                                                setSelectedIds((prev) => prev.filter((id) => id !== c.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {contacts.length > 5 && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            ...e mais {contacts.length - 5} contatos
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modo de envio */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                            <div className="text-sm font-semibold text-gray-800 mb-2">Modo de envio</div>
                            <div className="flex items-center gap-4 text-sm text-gray-700">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="sendMode" value="server" checked={sendMode === "server"} onChange={() => setSendMode("server")} />
                                    <span className="ml-1">Servidor (recomendado) — n8n buscará seus contatos</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="sendMode" value="client" checked={sendMode === "client"} onChange={() => setSendMode("client")} />
                                    <span className="ml-1">Enviar contatos selecionados</span>
                                </label>
                            </div>
                        </div>

                        {/* Upload de Imagem */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                            <label
                                htmlFor="image-upload"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Upload de Imagem (Opcional)
                            </label>
                            <label className="cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition text-center">
                                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                                    <p className="text-sm text-gray-600">
                                        Clique para selecionar imagem
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG ou GIF</p>
                                    {imageUploading && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Enviando imagem...
                                        </p>
                                    )}
                                </div>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>

                            {imagePreview && (
                                <div className="mt-4">
                                    <div className="relative w-48 h-48">
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            className="object-contain rounded-lg border border-gray-300"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview(null);
                                                setImageUrl(null);
                                            }}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Remover imagem
                                        </button>
                                        {imageUrl && (
                                            <span className="text-xs text-gray-600">
                                                URL: {imageUrl}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Enviar Mensagem
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </ProtectedRoute>
    );
}
