import ProjectEditorForm from '@/components/ProjectEditorForm';

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const projectId = parseInt(params.id, 10);
  return <ProjectEditorForm projectId={projectId} />;
}
