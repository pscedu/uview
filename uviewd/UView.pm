# $Id$

package UView;

use XML::Simple;
use Data::Dumper;

sub uview {

my $obj = XMLin(<<'EOF');
<Data><Job><Job_Id>1314.bl1.psc.teragrid.org</Job_Id><Job_Name>TQUASI-8</Job_Name>
<Job_Owner>mhutchin@bl1.psc.teragrid.org</Job_Owner>
<resources_used><cput>29:07:58</cput><mem>1172861292kb</mem><vmem>1172918736kb</vmem><walltime>29:24:48</walltime></resources_used>
<job_state>R</job_state><queue>batch_r</queue><server>bl1.psc.teragrid.org</server><Checkpoint>u</Checkpoint>
<ctime>1288274483</ctime><Error_Path>bl1.psc.teragrid.org:/bessemer/mhutchin/quasi/run_8/TQUASI-8.e1314</Error_Path>
<exec_host>bl1.psc.teragrid.org</exec_host><Hold_Types>n</Hold_Types><Join_Path>oe</Join_Path><Keep_Files>n</Keep_Files>
<Mail_Points>a</Mail_Points><mtime>1288284830</mtime>
<Output_Path>bl1.psc.teragrid.org:/bessemer/mhutchin/quasi/run_8/TQUASI-8.o1314</Output_Path><Priority>0</Priority>
<qtime>1288274483</qtime><Rerunable>False</Rerunable><Resource_List><ncpus>256</ncpus>
<nodeset>214-245:1712-1967,3696-3951</nodeset><walltime>200:00:00</walltime>
<walltime_max>00:00:00</walltime_max><walltime_min>00:00:00</walltime_min></Resource_List>
<session_id>266299</session_id><comment>Starting job at 10/28/10 10:01</comment><etime>1288274483</etime>
<submit_args>blacklight.job</submit_args><start_time>1288274483</start_time><start_count>1</start_count></Job></Data>
EOF
print STDERR Dumper($obj);
return ($obj);

	return XMLin(`qstat -fx`);
}

1;
