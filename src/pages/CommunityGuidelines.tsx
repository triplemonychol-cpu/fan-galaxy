import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Heart, MessageCircle, AlertTriangle, Ban, Flag, Scale } from "lucide-react";

const guidelines = [
  {
    icon: Heart,
    title: "Respect & Civility",
    rules: [
      "Treat all community members with respect, regardless of their opinions",
      "Use constructive language even when disagreeing",
      "No personal attacks, insults, or name-calling",
      "Respect cultural differences and diverse perspectives"
    ]
  },
  {
    icon: Ban,
    title: "No Violence or Threats",
    rules: [
      "Zero tolerance for threats of violence against individuals or groups",
      "No content that promotes, glorifies, or incites violence",
      "No sharing of violent imagery or disturbing content",
      "Report any threatening behavior immediately"
    ]
  },
  {
    icon: Shield,
    title: "No Hate Speech",
    rules: [
      "No discrimination based on race, ethnicity, gender, religion, or identity",
      "Avoid slurs, derogatory terms, or hateful language",
      "No content promoting supremacist ideologies",
      "Respect and celebrate diversity in our community"
    ]
  },
  {
    icon: MessageCircle,
    title: "Healthy Debates",
    rules: [
      "Focus on ideas and arguments, not personal characteristics",
      "Back up claims with sources when possible",
      "Be open to changing your mind when presented with new information",
      "Agree to disagree respectfully when consensus isn't possible"
    ]
  },
  {
    icon: AlertTriangle,
    title: "Content Standards",
    rules: [
      "No spam, excessive self-promotion, or misleading content",
      "No sharing of illegal content or pirated material",
      "Mark spoilers appropriately using spoiler tags",
      "Keep content relevant to the community/group topic"
    ]
  },
  {
    icon: Flag,
    title: "Report & Block",
    rules: [
      "Use the report feature for violations instead of engaging",
      "Block users who consistently cause you distress",
      "False reports may result in account restrictions",
      "Moderators review all reports and take appropriate action"
    ]
  },
  {
    icon: Scale,
    title: "Consequences",
    rules: [
      "First offense: Warning and content removal",
      "Second offense: Temporary suspension (24-72 hours)",
      "Third offense: Extended suspension (7-30 days)",
      "Severe violations: Permanent ban without warning"
    ]
  }
];

export default function CommunityGuidelines() {
  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-muted-foreground">
          Our community thrives when everyone feels safe and respected. Please follow these guidelines.
        </p>
      </div>

      <div className="space-y-6">
        {guidelines.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-xl">
                <section.icon className="h-5 w-5 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          By participating in this community, you agree to follow these guidelines.
          Violations may result in content removal or account suspension.
        </p>
      </div>
    </div>
  );
}
