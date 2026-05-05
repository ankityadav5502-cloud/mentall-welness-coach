import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Unhandled UI error:", error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              We hit an unexpected error
            </h1>
            <p className="text-sm text-muted-foreground">
              Your session is safe. Please reload to continue.
            </p>
            <Button onClick={this.handleReload}>Reload app</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
