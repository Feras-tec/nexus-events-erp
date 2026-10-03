import { SignIn } from "@clerk/react";
import { motion } from "motion/react";

export function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex w-full max-w-md flex-col items-center gap-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold">Nexus Events</h1>
          <p className="mt-2 text-base-content/60">
            ERP Management System
          </p>
        </div>

        <SignIn
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl="/dashboard"
        />
      </motion.div>
    </main>
  );
}
