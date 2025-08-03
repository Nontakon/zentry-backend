export const PageTitle = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 mt-1">{subtitle}</p>
    </div>
);