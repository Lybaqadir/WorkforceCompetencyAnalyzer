import { Card, Footer, PageHeader, Pill } from '../components/ui';
import { TrendIcon } from '../components/icons';
import { futureSkills } from '../data/teamData';

const timingTone = {
  Soon: 'warning',
  'Next Year': 'hybrid',
  'Further Ahead': 'grey',
};

export default function FutureSkillsScreen() {
  return (
    <div className="max-w-[1000px]">
      <PageHeader
        icon={<TrendIcon />}
        eyebrow="Future Team Planning"
        title="Skills your team will likely need in the next 2 to 3 years"
        subtitle="Your team does not have any of these yet — based on your current profile and where AI and the workforce is heading, worth thinking about now."
      />

      <div className="space-y-4">
        {futureSkills.map((skill) => (
          <Card key={skill.name} className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-base font-bold text-charcoal mb-1">{skill.name}</h3>
              <p className="text-sm text-charcoal/60 leading-relaxed">{skill.reason}</p>
            </div>
            <div className="shrink-0">
              <Pill tone={timingTone[skill.timing]}>{skill.timing}</Pill>
            </div>
          </Card>
        ))}
      </div>

      <Footer />
    </div>
  );
}
