import {analyzeSkillGap} from './skillGap.js';
const educationByCareer = {
	'Data Analyst': ['data', 'statistics', 'computer', 'business', 'economics', 'mathematics', 'analytics'],
	'Data Scientist': ['data', 'statistics', 'computer', 'mathematics', 'science'],
	'Data Engineer': ['data', 'computer', 'software', 'engineering'],
	'Web Developer': ['computer', 'software', 'information technology', 'engineering', 'web'],
	'Software Developer': ['computer', 'software', 'information technology', 'engineering'],
	'Database Administrator': ['computer', 'database', 'information technology', 'engineering'],
	'Cybersecurity Analyst': ['cybersecurity', 'computer', 'information technology', 'networking'],
	'Cloud Engineer': ['computer', 'cloud', 'information technology', 'engineering'],
	'UI/UX Designer': ['design', 'human-computer', 'arts', 'interaction'],
	'Accountant': ['accounting', 'finance', 'commerce', 'business'],
	'Financial Analyst': ['finance', 'accounting', 'economics', 'business'],
	'Business Analyst': ['business', 'management', 'computer', 'economics'],
	'Digital Marketer': ['marketing', 'business', 'communications', 'media'],
	'Lawyer': ['law', 'legal'],
	'Doctor': ['medicine', 'medical'],
	'Nurse': ['nursing', 'medical'],
	'Teacher': ['education', 'teaching'],
	'Project Manager': ['project management', 'business', 'management']
};

export function recommend(student, careers, limit = 5) {
	const interests = new Set((student.interests || []).map((item) => item.toLowerCase()));
	const education = `${student.education?.degree || ''} ${student.education?.branch || ''}`.toLowerCase();

	return careers.map((career) => {
		const skill = analyzeSkillGap(student.skills, career.skills).matchScore;
		const targets = (career.interests || []).map((item) => item.toLowerCase());
		const interest = targets.length
			? Math.round(100 * targets.filter((target) => interests.has(target)).length / targets.length)
			: 100;
		const preferences = (career.educationPreferences?.length ? career.educationPreferences : educationByCareer[career.name] || []).map((item) => item.toLowerCase());
		const educationScore = preferences.length ? (preferences.some((preference) => education.includes(preference)) ? 100 : 35) : 50;
		const matchScore = Math.round(skill * 0.6 + interest * 0.25 + educationScore * 0.15);
		return {
			career,
			matchScore,
			why: `Based on your current profile: ${skill}% skill compatibility, ${interest}% interest alignment, and ${educationScore}% education alignment.`
		};
	}).sort((left, right) => right.matchScore - left.matchScore).slice(0, limit);
}

export function rankResumeCareers(resumeSkills = [], careers = [], limit = 5) {
	const skillNames = new Set(resumeSkills.map((skill) => String(skill.name || skill).trim().toLowerCase()));
	if (!skillNames.size) return [];

	return careers.map((career) => {
		const requirements = career.skills || [];
		const totalWeight = requirements.reduce((sum, skill) => sum + Number(skill.weight || 1), 0);
		const matched = requirements.filter((skill) => skillNames.has(String(skill.skillName || '').toLowerCase()));
		const matchedWeight = matched.reduce((sum, skill) => sum + Number(skill.weight || 1), 0);
		return {
			career: career.name,
			matchScore: totalWeight ? Math.round(matchedWeight / totalWeight * 100) : 0,
			matchedSkills: matched.map((skill) => skill.skillName),
			missingSkills: requirements.filter((skill) => !skillNames.has(String(skill.skillName || '').toLowerCase())).map((skill) => skill.skillName),
			requiredSkillCount: requirements.length
		};
	}).filter((match) => match.matchedSkills.length)
		.sort((left, right) => right.matchScore - left.matchScore || right.matchedSkills.length - left.matchedSkills.length)
		.slice(0, limit);
}
