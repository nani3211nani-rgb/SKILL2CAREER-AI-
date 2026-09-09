import crypto from 'crypto';

const skills=['Excel','SQL','Python','JavaScript','HTML','CSS','React','Java','C++','Git','Linux','Power BI','Tableau','Cloud Computing','Networking','Cybersecurity','Data Visualization','Machine Learning','Data Structures','Algorithms','APIs','Docker','AWS','Azure','Node.js','Statistics','Problem Solving','Critical Thinking','Research','Data Cleaning','Accounting','Financial Analysis','Business Analysis','Marketing','SEO','Digital Advertising','Requirements Gathering','Project Management','Communication','Teamwork','Presentation','Time Management','Figma','UX Research','Wireframing','Prototyping','Visual Design'];
const careerDefinitions={"Data Analyst":'Excel,SQL,Python,Statistics,Power BI,Data Visualization',"Web Developer":'HTML,CSS,JavaScript,React,Git,APIs',"Software Developer":'Python,Java,Data Structures,Algorithms,Git,Problem Solving',"UI/UX Designer":'Figma,UX Research,Wireframing,Prototyping,Visual Design,Communication',"Digital Marketer":'Marketing,SEO,Digital Advertising,Data Visualization,Communication',"Cybersecurity Analyst":'Cybersecurity,Networking,Linux,Python,Problem Solving',"Accountant":'Accounting,Excel,Financial Analysis,Communication,Critical Thinking',"Business Analyst":'Business Analysis,Requirements Gathering,SQL,Excel,Communication',"Data Scientist":'Python,SQL,Statistics,Machine Learning,Data Cleaning,Data Visualization',"Cloud Engineer":'Cloud Computing,AWS,Azure,Docker,Linux,Networking,Git'};
const slug=value=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const id=()=>crypto.randomUUID();
const careers=Object.entries(careerDefinitions).map(([name,list])=>({
  _id:id(),name,slug:slug(name),description:`A practical career path focused on ${name} skills.`,industry:'Technology',educationPreferences:[],interests:['Technology','Data'],
  skills:list.split(',').map((skillName,index)=>({skillId:slug(skillName),skillName,requiredLevel:index<3?'Intermediate':'Beginner',importance:index<3?'High':'Medium',weight:index<3?1:.7})),roles:[name,`Junior ${name}`]
}));
const students=new Map();
const roadmaps=new Map();
const conversations=[];

export const catalog={skills:skills.map(name=>({_id:slug(name),name,category:'Technical',description:`Useful career skill: ${name}.`,aliases:[]})),careers};
export const store={
  findStudentByEmail:email=>[...students.values()].find(student=>student.email===email),
  findStudent:id=>students.get(id),
  saveStudent:student=>{students.set(student._id,student);return student;},
  findRoadmap:studentId=>[...roadmaps.values()].filter(item=>item.studentId===studentId).sort((a,b)=>b.createdAt-a.createdAt)[0],
  saveRoadmap:roadmap=>{roadmaps.set(roadmap._id,roadmap);return roadmap;},
  findCareer:idOrSlug=>careers.find(career=>career._id===idOrSlug||career.slug===idOrSlug),
  saveConversation:conversation=>conversations.push(conversation),
  newId:id
};

export function createStudent(data){return store.saveStudent({_id:id(),...data});}

const guest=createStudent({name:'Guest User',email:'guest@skill2career.ai',education:{},interests:[],skills:[],profileCompleted:false,createdAt:new Date(),updatedAt:new Date()});
store.guest=guest;