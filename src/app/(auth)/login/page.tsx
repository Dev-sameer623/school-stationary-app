import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/login-bg.png)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#14241c]/55" aria-hidden />
      <section className="relative w-full max-w-md rounded-xl border border-[#e4d9c8]/80 bg-[#fffdf8]/95 p-8 shadow-sm">
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-primary">School outfitter</p>
        <h1 className="mt-3 font-serif text-3xl font-medium">Stationery & Uniforms</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">Sign in with your staff account.</p>
        <LoginForm />
      </section>
    </main>
  );
}
