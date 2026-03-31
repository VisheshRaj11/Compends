import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

const faqs = [
  {
    ques: "What is this platform and who is it for?",
    ans: "This platform is a community-driven space designed especially for college students. It allows you to connect with peers, build communities, collaborate on projects, prepare for hackathons, and grow together both academically and socially."
  },
  {
    ques: "How can I connect and interact with other students?",
    ans: "You can join or create communities based on your interests, colleges, or goals. Inside communities, you can chat, participate in discussions, do video calls, and collaborate on projects or ideas in real-time."
  },
  {
    ques: "Can I work on projects and design ideas here?",
    ans: "Yes! The platform allows you to create and share project ideas, build wireframes, and collaborate with other students. You can showcase your work, get feedback, and even find teammates for hackathons."
  },
  {
    ques: "How does the platform help with coding and rankings?",
    ans: "You can track and compare your progress with others using integrations like LeetCode and GitHub. It helps you stay motivated by seeing where you stand within your community."
  },
  {
    ques: "What makes this platform different from others?",
    ans: "Unlike typical platforms, this one focuses on both productivity and connection. It combines learning, collaboration, entertainment, and social interaction in one place—helping students who feel isolated find like-minded peers and grow together."
  }
];

const Accordian = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <Accordion
        type="single"
        collapsible
        className="space-y-4"
      >
        {faqs.map((item, index) => (
          <AccordionItem
            key={index}
            value={String(index)}
            className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur-lg shadow-lg hover:bg-white/10 transition-all duration-300"
          >
            <AccordionTrigger className="px-6 py-4 text-left text-lg font-medium text-white hover:no-underline">
              {item.ques}
            </AccordionTrigger>

            <AccordionContent className="px-6 pb-4 text-gray-300 leading-relaxed">
              {item.ans}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

export default Accordian