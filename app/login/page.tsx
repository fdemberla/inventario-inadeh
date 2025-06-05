// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Label, TextInput, Button, Card } from "flowbite-react";
// import toast from "react-hot-toast";
// import Image from "next/image";

// export default function LoginPage() {
//   const router = useRouter();
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       const response = await fetch("/api/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ username, password }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         toast.success(`Bienvenido ${username}`);
//         router.push("/dashboard");
//       } else {
//         toast.error(data.message || "Credenciales incorrectas");
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       toast.error("Error de conexión. Intente más tarde.");
//     }
//   };

//   return (
//     <div className="bg-brand-gris flex min-h-screen items-center justify-center px-4 dark:bg-gray-900">
//       <Card className="w-full max-w-md border-0 bg-white shadow-lg dark:bg-gray-800">
//         {/* Logo + Título */}
//         <div className="flex flex-col items-center gap-3 pt-4">
//           <Image src="/favicon.png" alt="Logo" width={64} height={64} />
//           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
//             Sistema de Inventario
//           </h1>
//         </div>

//         <h2 className="mt-4 mb-6 text-center text-lg font-semibold text-gray-700 dark:text-gray-300">
//           Iniciar sesión
//         </h2>

//         <form onSubmit={handleLogin} className="flex flex-col gap-4 px-4 pb-6">
//           <div>
//             <Label
//               htmlFor="username"
//               className="text-gray-700 dark:text-gray-200"
//             >
//               Usuario
//             </Label>
//             <TextInput
//               id="username"
//               type="text"
//               placeholder="Tu nombre de usuario"
//               required
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="mt-1"
//             />
//           </div>

//           <div>
//             <Label
//               htmlFor="password"
//               className="text-gray-700 dark:text-gray-200"
//             >
//               Contraseña
//             </Label>
//             <TextInput
//               id="password"
//               type="password"
//               placeholder="••••••••"
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
//             />
//           </div>

//           <Button
//             type="submit"
//             className="bg-brand-azul w-full hover:bg-blue-700 dark:hover:bg-blue-800"
//           >
//             Ingresar
//           </Button>
//         </form>
//       </Card>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label, TextInput, Button, Card } from "flowbite-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { getDB } from "@/lib/localdb"; // assumes you created this

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const db = await getDB();

    if (!navigator.onLine) {
      // Try offline login with saved credentials
      const user = await db.get("users", username);
      if (user && user.password === password) {
        toast.success(`Modo offline. Bienvenido ${username}`);
        router.push("/dashboard");
      } else {
        toast.error("Sin conexión. Credenciales no encontradas localmente.");
      }
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Bienvenido ${username}`);

        // Store credentials for offline use
        await db.put("users", { username, password }); // Consider hashing password in real app

        router.push("/dashboard");
      } else {
        toast.error(data.message || "Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error de conexión. Intente más tarde.");
    }
  };

  return (
    <div className="bg-brand-gris flex min-h-screen items-center justify-center px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md border-0 bg-white shadow-lg dark:bg-gray-800">
        {/* Logo + Título */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <Image src="/favicon.png" alt="Logo" width={64} height={64} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Sistema de Inventario
          </h1>
        </div>

        <h2 className="mt-4 mb-6 text-center text-lg font-semibold text-gray-700 dark:text-gray-300">
          Iniciar sesión
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 px-4 pb-6">
          <div>
            <Label
              htmlFor="username"
              className="text-gray-700 dark:text-gray-200"
            >
              Usuario
            </Label>
            <TextInput
              id="username"
              type="text"
              placeholder="Tu nombre de usuario"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="password"
              className="text-gray-700 dark:text-gray-200"
            >
              Contraseña
            </Label>
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <Button
            type="submit"
            className="bg-brand-azul w-full hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Ingresar
          </Button>
        </form>
      </Card>
    </div>
  );
}
