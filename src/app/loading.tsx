import { LoadingState } from "@/components/common/StatusState";

export default function Loading() {
  return (
    <div className="route-loading">
      <LoadingState label="Page တင်နေပါတယ်…" />
    </div>
  );
}
