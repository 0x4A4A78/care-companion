import { redirect } from "next/navigation";
import { getPortalUser } from "../../../../lib/auth/portal-user";
import { getCustomerRequestsWithReviews } from "../../../../lib/data/queries";
import { CustomerJobListView } from "./job-list-view";

export const dynamic = "force-dynamic";

export default async function CustomerJobsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/login?error=session");
  if (user.role !== "customer" && user.role !== "admin") {
    redirect(`/${user.role}`);
  }

  const jobs = await getCustomerRequestsWithReviews(user.id);

  return (
    <div className="page-wrap">
      <CustomerJobListView initialJobs={jobs} />
    </div>
  );
}
