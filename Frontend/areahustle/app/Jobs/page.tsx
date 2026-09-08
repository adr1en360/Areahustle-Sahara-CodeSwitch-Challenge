import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobFeed } from "@/components/JobFeed";
import { VoiceTerminal } from "@/components/VoiceTerminal";

export default function JobsPage() {
	return (
		<>
			<Navbar />
			<main className="flex-1">
				<JobFeed />
			</main>
			<VoiceTerminal />
			<Footer />
		</>
	);
}
