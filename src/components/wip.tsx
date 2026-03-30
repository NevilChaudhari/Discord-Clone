export default function WIP({ title = "Work in Progress", message = "This feature is currently being built." }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-white/70">

            {/* Icon */}
            <div className="mb-4 text-yellow-400">
                🚧
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-white mb-2">
                {title}
            </h2>

            {/* Message */}
            <p className="text-sm max-w-sm">
                {message}
            </p>

        </div>
    );
}