"use client";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white py-3 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>
          Desenvolvido por{" "}
          <span className="font-medium text-gray-800 dark:text-white">
            Ronny Senna
          </span>
        </span>
        <a
          href="https://www.linkedin.com/in/ronnysenna"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-linkedin"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2h-0a2 2 0 0 0-2 2v7h-4v-14h4" />
          </svg>
          <span className="sr-only">LinkedIn</span>
          <span className="text-xs">/ronnysenna</span>
        </a>
        <a
          href="https://wa.me/5585991904540"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-message-circle"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="sr-only">WhatsApp</span>
          <span className="text-xs">+55 85 99190-4540</span>
        </a>
      </div>
    </footer>
  );
}
