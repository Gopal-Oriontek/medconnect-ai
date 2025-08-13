
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Stethoscope,
  FileText,
  Clock,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Shield,
  Globe,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">MedReview</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="text-center space-y-6">
          <Badge className="px-4 py-2 text-sm">
            Professional Medical Review Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Get Expert Medical
            <span className="text-blue-600 block">Second Opinions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with qualified medical professionals for comprehensive document reviews, 
            consultations, and expert opinions. Secure, fast, and reliable healthcare insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" className="px-8" asChild>
              <Link href="/auth/signup">
                Start Your Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose MedReview?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform connects you with licensed medical professionals for secure, comprehensive reviews
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Expert Reviewers</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base">
                Licensed medical professionals with specialized expertise in various fields including 
                cardiology, orthopedics, and radiology.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Fast Turnaround</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base">
                Receive comprehensive medical reviews within 24-48 hours. Urgent cases can be 
                prioritized for faster processing.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base">
                HIPAA-compliant platform ensuring your medical information remains completely secure 
                and confidential throughout the review process.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive medical review services tailored to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Second Opinion</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Expert review of diagnoses, treatment plans, and medical recommendations
                </CardDescription>
                <div className="text-center mt-4">
                  <Badge variant="secondary">From $180</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Stethoscope className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Live video consultations with medical specialists
                </CardDescription>
                <div className="text-center mt-4">
                  <Badge variant="secondary">From $220</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Document Review</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Comprehensive analysis of medical reports, lab results, and imaging
                </CardDescription>
                <div className="text-center mt-4">
                  <Badge variant="secondary">From $150</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Star className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Expert Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  In-depth medical analysis by specialists with detailed recommendations
                </CardDescription>
                <div className="text-center mt-4">
                  <Badge variant="secondary">From $280</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Simple, secure, and straightforward process
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
            <p className="text-gray-600">
              Securely upload your medical documents, reports, and imaging files
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Expert Assignment</h3>
            <p className="text-gray-600">
              We match you with a qualified specialist based on your medical needs
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Professional Review</h3>
            <p className="text-gray-600">
              Medical expert thoroughly reviews your case and prepares detailed analysis
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              4
            </div>
            <h3 className="text-xl font-semibold mb-2">Receive Results</h3>
            <p className="text-gray-600">
              Get comprehensive review results with recommendations and next steps
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl opacity-90">
              Join patients and healthcare providers who trust MedReview
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1,500+</div>
              <div className="text-lg opacity-90">Reviews Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-lg opacity-90">Medical Experts</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-lg opacity-90">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="bg-gray-50 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who have received expert medical reviews. 
            Upload your documents today and get professional insights within hours.
          </p>
          <Button size="lg" className="px-8" asChild>
            <Link href="/auth/signup">
              Start Your Review Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Stethoscope className="h-6 w-6" />
                <span className="text-xl font-bold">MedReview</span>
              </div>
              <p className="text-gray-400">
                Professional medical review platform connecting patients with qualified healthcare experts.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Second Opinion</li>
                <li>Consultation</li>
                <li>Document Review</li>
                <li>Expert Analysis</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Medical Disclaimer</li>
                <li>How It Works</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Security</h4>
              <div className="flex items-center space-x-2 text-gray-400">
                <Shield className="h-4 w-4" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 mt-2">
                <Globe className="h-4 w-4" />
                <span>SSL Encrypted</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2025 MedReview. All rights reserved.</p>
            <p className="text-sm mt-2">
              <strong>Medical Disclaimer:</strong> This platform provides expert medical reviews for informational purposes only. 
              Always consult with your healthcare provider for medical decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
