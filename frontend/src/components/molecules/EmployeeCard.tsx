import { Avatar } from "../atoms/Avatar";
import { StatusChip } from "../atoms/StatusChip";

type EmployeeCardProps = {
  employeeNo: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  position?: string | null;
  status: string;
};

export function EmployeeCard({
  employeeNo,
  firstName,
  lastName,
  email,
  position,
  status,
}: EmployeeCardProps) {
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <article className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-start gap-4">
          <Avatar
            alt={`${firstName} ${lastName}`}
            initials={initials}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">
                  {firstName} {lastName}
                </h3>

                <p className="text-sm text-base-content/60">
                  {employeeNo}
                </p>
              </div>

              <StatusChip status={status} />
            </div>

            {position && (
              <p className="mt-3 text-sm">{position}</p>
            )}

            {email && (
              <p className="mt-1 truncate text-sm text-base-content/60">
                {email}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
