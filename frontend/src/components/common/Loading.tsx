interface LoadingProps {
  label?: string;
}

function Loading({ label = "Loading..." }: LoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-gray-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
      <span>{label}</span>
    </div>
  );
}

export default Loading;
