import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  account: { id: string; name: string } | null;
}

export const KeywordMetricsDialog = ({ open, onClose, account }: Props) => {
  const { token } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [range, setRange] = useState("7days");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const analyzeKeyword = async () => {
    if (!keyword.trim() || !account) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(
        `http://localhost:4000/api/facebook/accounts/${account.id}/keyword-metrics?keyword=${keyword}&range=${range}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to fetch metrics");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyword Performance</DialogTitle>
          <p className="text-sm text-gray-500">
            Ad Account: <b>{account?.name}</b>
          </p>
        </DialogHeader>

        {/* Inputs */}
        <div className="space-y-3">
          <Input
            placeholder="Enter keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={analyzeKeyword}
            disabled={loading || !keyword.trim()}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Analyze
          </Button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        {/* Result */}
        {result && (
          <div className="mt-4 rounded-md border bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Spend</span>
              <b>₹{result.totalSpend}</b>
            </div>
            <div className="flex justify-between">
              <span>Conversions</span>
              <b>{result.totalConversions}</b>
            </div>
            <div className="flex justify-between">
              <span>Cost / Conversion</span>
              <b>₹{result.costPerConversion}</b>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
