# $Id$
# %PSC_START_COPYRIGHT%
# -----------------------------------------------------------------------------
# Copyright (c) 2010, Pittsburgh Supercomputing Center (PSC).
#
# Permission to use, copy, and modify this software and its documentation
# without fee for personal use or non-commercial use within your organization
# is hereby granted, provided that the above copyright notice is preserved in
# all copies and that the copyright and this permission notice appear in
# supporting documentation.  Permission to redistribute this software to other
# organizations or individuals is not permitted without the written permission
# of the Pittsburgh Supercomputing Center.  PSC makes no representations about
# the suitability of this software for any purpose.  It is provided "as is"
# without express or implied warranty.
# -----------------------------------------------------------------------------
# %PSC_END_COPYRIGHT%

package UView;

use XML::Simple;
use Data::Dumper;
use Storable qw(freeze thaw);
use JSON;
use threads;
use threads::shared;
use Sys::Hostname;

use constant HISTORY_NJOBS => 8;

our $s_history : shared;
our $s_jobs : shared;
our $s_queue : shared;
our $s_hostname = hostname;

sub uview {
	my $s = shift;
	$s->return_die_message(1);

	lock($s_history);
	lock($s_jobs);
	lock($s_queue);

	return {
		sysinfo	=> {
			hostname	=> $s_hostname,
			mem		=> 16*1024,
			mempercpu	=> 8,
			gb_per_memnode	=> 64,
		},
		history	=> thaw($s_history),
		jobs	=> thaw($s_jobs),
		queue	=> thaw($s_queue),
	};
}

sub count_secs {
	my $tm = shift;
	my $secs = 0;
	if ($tm && $tm =~ /^(\d+):(\d+):(\d+)$/) {
		$secs += $1 * 60 * 60;
		$secs += $2 * 60;
		$secs += $3;
	}
	return $secs;
}

sub hasjob {
	my ($jobs, $j) = @_;

	my $i;
	foreach $i (@$jobs) {
		return 1 if $i->{Job_Id} eq $j->{Job_Id};
	}
	return (0);
}

threads->create(sub {
	my $str = "";
	for (;;) {
		my $nstr = `ssh bl0.t qstat -fx`;
		if ($nstr ne $str) {
			my $ndata = XMLin($nstr);

			$ndata->{Job} = $ndata->{Data}{Job} if
			    exists $ndata->{Data};
			$ndata = {} unless ref $ndata eq "HASH";
			$ndata->{Job} = [ $ndata->{Job} ] if
			    ref $ndata->{Job} eq "HASH";
			$ndata->{Job} = [] unless
			    ref $ndata->{Job} eq "ARRAY";

			my @newjobs = sort {
				$a->{Job_Id} cmp $b->{Job_Id}
			} @{ $ndata->{Job} };

			my ($j);
			for $j (@jobs) {
				push @history, $j unless hasjob(\@newjobs, $j);
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
		sleep(30);
	}
});

1;
