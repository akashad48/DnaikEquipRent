
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MapPin } from 'lucide-react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Equipment } from '@/types/plate';
import { FirebaseError } from 'firebase/app';

async function getFeaturedEquipment(): Promise<Equipment[]> {
  // This check is necessary because this is a public page and firebase might not be configured on first deploy
  if (!db) return [];
  try {
    const equipmentCollection = collection(db, "equipment");
    const q = query(equipmentCollection, limit(4));
    const equipmentSnapshot = await getDocs(q);
    return equipmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      console.log("Firestore permission-denied: Cannot fetch featured equipment for public landing page. This is expected if rules are not set for public reads.");
    } else {
      console.error("Failed to fetch featured equipment for landing page:", error);
    }
    return [];
  }
}

export default async function LandingPage() {
  const featuredEquipment = await getFeaturedEquipment();

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
              <path d="M12 2L1 9l4 1v9h5v-5h4v5h5V10l4-1z"/>
            </svg>
            <span className="font-bold text-xl font-headline">Dandnaik Equipment</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">About</a>
            <a href="#equipment" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Equipment</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Contact</a>
          </nav>
          <div>
            <Button asChild>
              <Link href="/login">Admin Login</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-white">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <Image
            src="https://images.pexels.com/photos/2138126/pexels-photo-2138126.jpeg"
            alt="Construction scaffolding against a blue sky, photo by Quang Nguyen Vinh"
            fill
            objectFit="cover"
            className="z-0"
            priority
          />
          <div className="z-20 relative container px-4">
            <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">Rent Reliable Equipment for Every Project</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">
              "Building tomorrow's landmarks, one piece of equipment at a time."
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <a href="#equipment">View Our Inventory</a>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <a href="#contact">Get a Quote</a>
              </Button>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">About Dandnaik Equipment Rental</h2>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground leading-relaxed">
              For over  5 years , Dandnaik Construction Equipment Rental has been the cornerstone of countless construction projects in and around Dharashiv. Founded on the principles of reliability, integrity, and unparalleled service, we provide a comprehensive range of centring plates to meet the demands of slab job, big or small and in coming yers  we are planning to expand our service with other equipment also . Our commitment is to empower our clients by providing the right tools and unwavering support, ensuring their projects are completed efficiently and safely.
            </p>
          </div>
        </section>

        {/* Featured Equipment Section */}
        <section id="equipment" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Featured Equipment</h2>
            {featuredEquipment.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredEquipment.map((item) => (
                  <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <Image
                      src={item.photoUrl || 'https://placehold.co/400x300.png'}
                      alt={item.name}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                      data-ai-hint={item.category}
                    />
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
               <p className="text-center text-muted-foreground">Could not load featured equipment. Please log in to view the full inventory.</p>
            )}
             <div className="text-center mt-12">
               <Button asChild>
                  <Link href="/login">View Full Inventory</Link>
                </Button>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Our Equipment in Action</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Image src="https://placehold.co/600x400.png" alt="Centering Plate 2x3 feet" width={600} height={400} className="rounded-lg shadow-md hover:scale-105 transition-transform" data-ai-hint="centering plate"/>
                    <Image src="https://placehold.co/600x400.png" alt="Gallery image 2" width={600} height={400} className="rounded-lg shadow-md hover:scale-105 transition-transform" data-ai-hint="construction machine"/>
                    <Image src="https://placehold.co/600x400.png" alt="Gallery image 3" width={600} height={400} className="rounded-lg shadow-md hover:scale-105 transition-transform" data-ai-hint="compactor machine"/>
                    <Image src="https://placehold.co/600x400.png" alt="Gallery image 4" width={600} height={400} className="rounded-lg shadow-md hover:scale-105 transition-transform" data-ai-hint="construction site"/>
                </div>
            </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Contact Us</h2>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <Card className="p-2">
                    <CardHeader>
                        <CardTitle>Get in Touch</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start space-x-4">
                            <MapPin className="h-6 w-6 text-primary mt-1 shrink-0"/>
                            <div>
                                <h3 className="font-semibold">Our Office</h3>
                                <p className="text-muted-foreground">Balaji Nagar, Shekapur Road, Dharashiv - 413501</p>
                            </div>
                        </div>
                         <div className="flex items-start space-x-4">
                            <Phone className="h-6 w-6 text-primary mt-1 shrink-0"/>
                            <div>
                                <h3 className="font-semibold">Phone Numbers</h3>
                                <p className="text-muted-foreground">9309757836</p>
                                <p className="text-muted-foreground">9822066601</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="h-80 w-full rounded-lg overflow-hidden shadow-lg">
                     <Image src="https://placehold.co/600x400.png" alt="Map" width={600} height={400} className="w-full h-full object-cover" data-ai-hint="city map"/>
                </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Dandnaik Construction Equipment Rental. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
