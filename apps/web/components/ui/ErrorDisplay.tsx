export const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex justify-center items-center h-full w-full bg-red-900/20 border border-red-500/50 rounded-lg p-4">
      <p className="text-red-400">Error: {message}</p>
    </div>
  );
  