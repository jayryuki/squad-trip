import { useParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PageWrapper from "@/components/layout/PageWrapper"
import { PersonalMoodboard } from "@/components/moodboard/PersonalMoodboard"
import { SharedMoodboard } from "@/components/moodboard/SharedMoodboard"

export default function MoodboardPage() {
  const { tripId } = useParams()

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold gradient-text">Moodboard</h1>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="personal" className="flex-1">
              My Board
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Group Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4">
            <PersonalMoodboard tripId={tripId!} />
          </TabsContent>

          <TabsContent value="shared" className="mt-4">
            <SharedMoodboard tripId={tripId!} />
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  )
}
