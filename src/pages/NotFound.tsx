import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <Link to="/" className="mt-6 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Go home</Link>
      </div>
    </div>
  );
}
