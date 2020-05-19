using Pacem.Apps.Services;
using Xunit;

namespace Pacem.Apps.Tests
{
    public class VersionComparerTests
    {
        [Fact]
        public void Comparisons()
        {
            var comparer = new VersionComparer();

            int c1 = comparer.Compare("0.10.0", "0.2");
            Assert.Equal(1, c1);

            int c2 = comparer.Compare(default, "0.2");
            Assert.Equal(-1, c2);

            int c3 = comparer.Compare(default, default);
            Assert.Equal(-1, c3);

            int c4 = comparer.Compare("0.0", default);
            Assert.Equal(1, c4);

            int c5 = comparer.Compare("9.9.9", "10.0.0");
            Assert.Equal(-1, c5);

            int c6 = comparer.Compare("9.10.9", "9.9.0");
            Assert.Equal(1, c6);

            int c7 = comparer.Compare("9.9.9", "9.9.90");
            Assert.Equal(-1, c7);
        }
    }
}
