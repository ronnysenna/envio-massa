"use client";

import { AlertCircle, CheckCircle, Loader2, Send, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
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
    const [status, setStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({
        type: null,
        message: "",
    });

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
        setStatus({ type: null, message: "" });

        if (!message.trim()) {
            toast.showToast({
                type: "error",
                message: "Por favor, digite uma mensagem.",
            });
            return;
        }

        const contactsToSend = contacts.filter(
            (c) => c.id && selectedIds.includes(c.id),
        );
        if (contactsToSend.length === 0) {
            toast.showToast({
                type: "error",
                message: "Por favor, selecione ao menos um contato para enviar.",
            });
            return;
        }

        setLoading(true);

        try {
            const result = await sendMessage({
                message,
                contacts: contactsToSend,
                imageUrl: imageUrl || undefined,
            });

            if (result.success) {
                toast.showToast({
                    type: "success",
                    message: `Mensagem enviada com sucesso para ${contactsToSend.length} contatos!`,
                });
                setMessage("");
                setContacts([]);
                setSelectedIds([]);
                setImageFile(null);
                setImagePreview(null);
                setImageUrl(null);
                setStatus({
                    type: "success",
                    message: `Enviado para ${contactsToSend.length} contatos`,
                });
            } else {
                toast.showToast({
                    type: "error",
                    message: result.error || "Erro ao enviar mensagem.",
                });
                setStatus({
                    type: "error",
                    message: result.error || "Erro ao enviar mensagem.",
                });
            }
        } catch (_err) {
            toast.showToast({
                type: "error",
                message: "Erro ao enviar mensagem. Tente novamente.",
            });
            setStatus({
                type: "error",
                message: "Erro ao enviar mensagem. Tente novamente.",
            });
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
            <div className="flex">
                <Sidebar />
                <main className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">
                        Enviar Mensagem
                    </h1>

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
                                    <div
                                        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 transition text-center ${contacts.length > 0 ? "border-green-500 bg-green-50" : "hover:border-blue-500"}`}
                                    >
                                        <Upload
                                            className={`mx-auto mb-2 ${contacts.length > 0 ? "text-green-600" : "text-gray-400"}`}
                                            size={32}
                                        />
                                        <p className="text-sm text-gray-600">
                                            {contacts.length > 0
                                                ? "Arquivo importado com sucesso!"
                                                : "Clique para selecionar arquivo"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">CSV ou XLSX</p>
                                        {contacts.length > 0 && (
                                            <div className="mt-2 text-xs text-green-700">
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
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col gap-2">
                                    <div className="font-semibold text-green-800">
                                        Pré-visualização dos contatos importados:
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
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
                                            <span className="text-sm font-semibold">
                                                Selecionar todos
                                            </span>
                                        </div>

                                        <div className="max-h-40">
                                            {contacts.length > 200 ? (
                                                <div ref={virtualContainerRef} style={{ height: 320, overflow: "auto" }} onScroll={onScroll}>
                                                    <div style={{ height: contacts.length * itemHeight, position: "relative" }}>
                                                        <div style={{ position: "absolute", top: startIndex * itemHeight, left: 0, right: 0 }}>
                                                            {visible.map((_, idx) => (
                                                                <Row key={contacts[startIndex + idx]?.id ?? contacts[startIndex + idx]?.telefone} index={startIndex + idx} style={{ height: itemHeight } as React.CSSProperties} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="overflow-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr>
                                                                <th className="text-left px-2 py-1">Nome</th>
                                                                <th className="text-left px-2 py-1">Telefone</th>
                                                                <th className="text-left px-2 py-1">Selecionar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {contacts.slice(0, 200).map((c) => (
                                                                <tr key={c.id || c.telefone} className="hover:bg-white">
                                                                    <td className="px-2 py-1">{c.nome}</td>
                                                                    <td className="px-2 py-1">{c.telefone}</td>
                                                                    <td className="px-2 py-1">
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
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {contacts.length > 5 && (
                                        <div className="text-xs text-gray-500">
                                            ...e mais {contacts.length - 5} contatos
                                        </div>
                                    )}
                                </div>
                            )}
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

                        {/* Status Messages */}
                        {status.type && (
                            <div
                                className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${status.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                            >
                                {status.type === "success" ? (
                                    <CheckCircle className="text-green-600 shrink-0" size={20} />
                                ) : (
                                    <AlertCircle className="text-red-600 shrink-0" size={20} />
                                )}
                                <p
                                    className={`text-sm ${status.type === "success" ? "text-green-800" : "text-red-800"}`}
                                >
                                    {status.message}
                                </p>
                            </div>
                        )}

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
                </main>
            </div>
        </ProtectedRoute>
    );
}
