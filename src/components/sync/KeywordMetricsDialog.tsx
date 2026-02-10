import { useEffect, useState } from "react";
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Props {
  open: boolean;
  onClose: () => void;
  account: { id: string; name: string } | null;
}

interface ResultData {
  totalSpend: number;
  totalConversions: number;
  costPerConversion: number;
}

export const KeywordMetricsDialog = ({ open, onClose, account }: Props) => {
  const { token } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [range, setRange] = useState("7days");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [noResult, setNoResult] = useState(false);
  const [error, setError] = useState("");

  /* -------------------------------------------------
     RESET STATE WHEN:
     - dialog opens
     - account changes
  -------------------------------------------------- */
  useEffect(() => {
    if (open) {
      setKeyword("");
      setRange("7days");
      setResult(null);
      setNoResult(false);
      setError("");
      setLoading(false);
    }
  }, [open, account?.id]);

  /* -------------------------------------------------
     CLEAR RESULT WHEN INPUT CHANGES
  -------------------------------------------------- */
  useEffect(() => {
    setResult(null);
    setNoResult(false);
    setError("");
  }, [keyword, range]);

  /* -------------------------------------------------
     ANALYZE KEYWORD
  -------------------------------------------------- */
  const analyzeKeyword = async () => {
    if (!keyword.trim() || !account) return;

    setLoading(true);
    setResult(null);
    setNoResult(false);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/facebook/accounts/${account.id}/keyword-metrics?keyword=${encodeURIComponent(
          keyword
        )}&range=${range}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      // Backend says: no result
      if (data?.message === "No result found") {
        setNoResult(true);
        return;
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to fetch metrics");
      }

      setResult({
        totalSpend: data.totalSpend,
        totalConversions: data.totalConversions,
        costPerConversion: data.costPerConversion,
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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

        {/* Loading */}
        {loading && (
          <p className="text-sm text-muted-foreground text-center mt-3">
            Analyzing keyword performance…
          </p>
        )}

        {/* No Result */}
        {noResult && !loading && (
          <div className="mt-4 rounded-md border bg-gray-50 p-4 text-sm text-center text-muted-foreground">
            No result found for this keyword and date range.
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
        )}

        {/* Result */}
        {result && !noResult && !loading && (
          <div className="mt-4 rounded-md border bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Spend</span>
              <b>₹{result.totalSpend.toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span>Conversions</span>
              <b>{result.totalConversions}</b>
            </div>
            <div className="flex justify-between">
              <span>Cost / Conversion</span>
              <b>₹{result.costPerConversion.toFixed(2)}</b>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
