import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Pill geometry and a spring-ish easing are the two things that make the
  // whole UI feel like one system.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium " +
    "transition-all duration-200 ease-spring " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-soft hover:shadow-lift hover:bg-primary/90",
        accent:
          "bg-accent text-accent-foreground shadow-soft hover:shadow-accent hover:bg-accent/90",
        outline:
          "border border-border bg-card text-foreground shadow-xs hover:border-foreground/25 hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        subtle: "bg-secondary text-secondary-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        link: "text-accent underline-offset-4 hover:underline",

        /** @deprecated Legacy name from the previous palette — use `accent`. */
        gold: "bg-accent text-accent-foreground shadow-soft hover:shadow-accent hover:bg-accent/90",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem] [&_svg]:size-3.5",
        md: "h-11 px-6 text-sm [&_svg]:size-4",
        lg: "h-13 px-8 text-[0.9375rem] [&_svg]:size-4",
        icon: "size-10 [&_svg]:size-4",
        "icon-sm": "size-9 [&_svg]:size-4",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner and blocks interaction. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
