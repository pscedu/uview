# $Id$

package UView;

use XML::Simple;
use Data::Dumper;
use Storable qw(freeze thaw);
use JSON;
use threads;
use threads::shared;

use constant HISTORY_NJOBS => 8;

our $s_history : shared;
our $s_jobs : shared;
our $s_queue : shared;

sub uview {
	my $s = shift;
	$s->return_die_message(1);

	lock($s_history);
	lock($s_jobs);
	lock($s_queue);

	return {
		history	=> thaw($s_history),
		jobs	=> thaw($s_jobs),
		queue	=> thaw($s_queue),
	};
}

sub bsearch {
	my ($key, $cmp, $a) = @_;
	my $min = 0;
	my $max = $#a;
	my $mid;
	while ($min <= $max) {
		$mid = ($max - $min) / 2 + $min;
		my $i = $a->[$mid];
		my $val = $cmp->($key, $i);
		return $i if $val == 0;
		if ($val > 0) {
			$max = $mid - 1;
		} else {
			$min = $mid + 1;
		}
	}
	return undef;
}

sub count_secs {
	my $tm = shift;
	my $secs = 0;
	if ($tm =~ /^(\d+):(\d+):(\d+)$/) {
		$secs += $1 * 60 * 60;
		$secs += $2 * 60;
		$secs += $3;
	}
	return $secs;
}

threads->create(sub {
	my $str = "";
	for (;;) {
		my $nstr = `qstat -fx`;
		if ($nstr ne $str) {
			my $ndata = XMLin($nstr);

			$ndata = {} unless ref $ndata eq "HASH";
			$ndata->{Job} = [] unless
			    ref $ndata->{Job} eq "ARRAY";

			my @newjobs = sort {
				$a->{Job_Id} cmp $b->{Job_Id}
			} @{ $ndata->{Job} };

			my ($j);
			for $j (@jobs) {
				unless (bsearch($j, sub {
				    return $_[0]->{Job_Id} cmp
					   $_[1]->{Job_Id} },
				    \@newjobs)) {
					push @history, $j;
				}
			}

			@jobs = ();
			@queue = ();

			@history = sort {
				$a->{ctime} + count_secs($a->{resources_used}{walltime})
				cmp
				$b->{ctime} + count_secs($b->{resources_used}{walltime})
			} @history;
			splice @history, HISTORY_NJOBS if
			    @history > HISTORY_NJOBS;

			for $j (@newjobs) {
				if ($j->{job_state} eq 'R') {
					push @jobs, $j;
				} elsif ($j->{job_state} eq 'Q') {
					push @queue, $j;
				}
			}
			@jobs = sort { $a->{ctime} cmp $b->{ctime} } @jobs;
			@queue = sort { $a->{ctime} cmp $b->{ctime} } @queue;

			$str = $nstr;

			lock($s_history);
			lock($s_jobs);
			lock($s_queue);

			$s_history = freeze \@history;
			$s_jobs = freeze \@jobs;
			$s_queue = freeze \@queue;
		}
		sleep(5 * 60);
	}
});

1;
