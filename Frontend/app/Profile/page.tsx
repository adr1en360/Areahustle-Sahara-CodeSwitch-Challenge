
export default function ProfilePage() {
	return (
		<>
			<main className="flex-1 max-w-4xl mx-auto w-full p-6">
				<div className="rounded-3xl bg-card shadow-elevated p-8">
					<p className="text-xs uppercase tracking-widest text-primary font-semibold">Profile</p>
					<h1 className="font-display text-3xl font-bold mt-2">Demo hustler profile</h1>
					<p className="text-muted-foreground mt-3">Profile details are stored locally until the real API is connected.</p>
				</div>
			</main>
		</>
	);
}
