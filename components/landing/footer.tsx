export default function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Aigency. All rights reserved.
      </div>
    </footer>
  )
}
