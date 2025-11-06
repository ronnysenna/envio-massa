"use client";

export default function Brand({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="text-blue-500">Envio</span>
      <span className="mx-1 text-yellow-600 font-extrabold">Express</span>
    </span>
  );
}
