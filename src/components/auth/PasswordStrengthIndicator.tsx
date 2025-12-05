import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  showConfirmMatch?: boolean;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  confirmPassword,
  showConfirmMatch = false 
}: PasswordStrengthIndicatorProps) {
  const requirements: Requirement[] = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Pelo menos 1 número", met: /[0-9]/.test(password) },
    { label: "Pelo menos 1 símbolo (!@#$%...)", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: "Pelo menos 1 letra maiúscula", met: /[A-Z]/.test(password) },
  ];

  if (showConfirmMatch && confirmPassword !== undefined) {
    requirements.push({
      label: "Senhas coincidem",
      met: password.length > 0 && password === confirmPassword,
    });
  }

  const metCount = requirements.filter(r => r.met).length;
  const strengthPercent = (metCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strengthPercent <= 25) return "bg-destructive";
    if (strengthPercent <= 50) return "bg-warning";
    if (strengthPercent <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", getStrengthColor())}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {strengthPercent === 100 ? "Senha forte ✓" : "Complete os requisitos abaixo"}
        </p>
      </div>

      {/* Requirements list */}
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li 
            key={index}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function isPasswordValid(password: string): boolean {
  return (
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password) &&
    /[A-Z]/.test(password)
  );
}
