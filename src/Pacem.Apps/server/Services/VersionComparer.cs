using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

namespace Pacem.Apps.Services
{
    public class VersionComparer : IComparer<string>
    {
        public const string VersionPattern = @"^[0-9]+(\.[0-9]+){0,2}$";

        public int Compare([AllowNull] string x, [AllowNull] string y)
        {
            if (x == null)
            {
                return -1;
            }
            if (y == null)
            {
                return 1;
            }

            if (Regex.IsMatch(x, VersionPattern) && Regex.IsMatch(y, VersionPattern))
            {
                string[] vx = x.Split('.');
                string[] vy = y.Split('.');

                for (var i = 0; i < Math.Max(vx.Length, vy.Length); i++)
                {
                    int xx = 0, yy = 0;
                    if (i < vx.Length)
                    {
                        xx = int.Parse(vx[i]);
                    }
                    if (i < vy.Length)
                    {
                        yy = int.Parse(vy[i]);
                    }
                    if (xx != yy)
                    {
                        return xx.CompareTo(yy);
                    }
                }

            }
            return 0;
        }
    }
}
