import { Header } from '@/components/organisms/header'
import { Navigation } from '@/components/organisms/navigation'

type MainLayoutProps = {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container flex gap-6 py-6">
          <aside className="w-64 shrink-0">
            <div className="sticky top-20">
              <Navigation />
            </div>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
