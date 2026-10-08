import {
  Card,
  CardContent,
  CardHeader,
} from "../components/ui/Card";

import Button from "../components/ui/Button";

import Badge from "../components/ui/Badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";

const transactions = [
  {
    invoice: "INV-0001",
    customer: "Walk-in Customer",
    amount: "KSh 1,250",
    payment: "M-Pesa",
    status: "Completed",
  },
  {
    invoice: "INV-0002",
    customer: "John Kamau",
    amount: "KSh 850",
    payment: "Cash",
    status: "Completed",
  },
  {
    invoice: "INV-0003",
    customer: "Mary Wanjiku",
    amount: "KSh 2,450",
    payment: "Card",
    status: "Completed",
  },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Dashboard
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Pharmacy operations overview
          </p>
        </div>

        <Button size="sm">
          + New Sale
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="text-xs text-slate-500">
              Today's Sales
            </div>

            <div className="text-xl font-semibold text-slate-800 mt-2">
              KSh 84,520
            </div>

            <div className="text-xs text-green-600 mt-2">
              ↑ 12.4% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-xs text-slate-500">
              Today's Profit
            </div>

            <div className="text-xl font-semibold text-slate-800 mt-2">
              KSh 21,340
            </div>

            <div className="text-xs text-green-600 mt-2">
              ↑ 8.2% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-xs text-slate-500">
              Low Stock
            </div>

            <div className="text-xl font-semibold text-slate-800 mt-2">
              24
            </div>

            <div className="text-xs text-amber-600 mt-2">
              Requires attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-xs text-slate-500">
              Prescriptions
            </div>

            <div className="text-xl font-semibold text-slate-800 mt-2">
              38
            </div>

            <div className="text-xs text-blue-600 mt-2">
              7 pending
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 mt-5">
        <Card>
          <CardHeader
            title="Recent Transactions"
            action={
              <Button
                variant="ghost"
                size="sm"
              >
                View All
              </Button>
            }
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Invoice
                </TableHead>

                <TableHead>
                  Customer
                </TableHead>

                <TableHead>
                  Amount
                </TableHead>

                <TableHead>
                  Payment
                </TableHead>

                <TableHead>
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {transactions.map(
                (transaction) => (
                  <TableRow
                    key={
                      transaction.invoice
                    }
                  >
                    <TableCell className="font-medium">
                      {transaction.invoice}
                    </TableCell>

                    <TableCell>
                      {transaction.customer}
                    </TableCell>

                    <TableCell>
                      {transaction.amount}
                    </TableCell>

                    <TableCell>
                      {transaction.payment}
                    </TableCell>

                    <TableCell>
                      <Badge variant="success">
                        {
                          transaction.status
                        }
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader
            title="Stock Alerts"
            action={
              <Badge variant="warning">
                24 items
              </Badge>
            }
          />

          <CardContent>
            <div className="space-y-3">
              {[
                [
                  "Amoxicillin 500mg",
                  "7 remaining",
                ],
                [
                  "Cetirizine 10mg",
                  "4 remaining",
                ],
                [
                  "Ibuprofen 400mg",
                  "9 remaining",
                ],
              ].map(([name, stock]) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <div className="text-xs font-medium text-slate-700">
                      {name}
                    </div>

                    <div className="text-[11px] text-red-500 mt-1">
                      {stock}
                    </div>
                  </div>

                  <Badge variant="danger">
                    Low
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}