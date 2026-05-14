import { AlertCircle } from "lucide-react";

interface Props {
  message?: string;
  errors?: Record<string, string[]>;
}

export function AuthFormError({ message, errors }: Props) {
  if (!message && !errors) return null;
  const list = errors ? Object.values(errors).flat() : [];

  return (
    <div role="alert" className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
      <div className="flex items-start gap-2 text-destructive">
        <AlertCircle className="size-4 mt-0.5 shrink-0" />
        <div>
          {message && <div className="font-medium">{message}</div>}
          {list.length > 0 && (
            <ul className="list-disc ml-4 mt-1 space-y-0.5">
              {list.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
