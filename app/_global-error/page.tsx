export const dynamic = "force-dynamic";

export default function GlobalError() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Erro</h1>
      <p style={{ color: "#555" }}>
        Ocorreu um erro inesperado. Tente novamente mais tarde.
      </p>
    </main>
  );
}
