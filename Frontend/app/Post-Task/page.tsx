import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CreateJob } from "@/components/CreateJob";

export default function PostTaskPage() {
	return (
		<>
			<Navbar />
			<main className="flex-1">
				<CreateJob />
			</main>
			<Footer />
		</>
	);
}
