import { JobFeed } from "@/components/JobFeed";
import { VoiceTerminal } from "@/components/VoiceTerminal";

export default function JobsPage() {
	return (
		<>
			<main className="max-w-6xl mx-auto flex-1">
				<JobFeed />
			</main>
			<VoiceTerminal />
		</>
	);
}
