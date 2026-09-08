import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Register } from "@/components/Register";

export default function OnboardingPage() {
	return (
		<>
			<Navbar />
			<main className="flex-1">
				<Register />
			</main>
			<Footer />
		</>
	);
}
